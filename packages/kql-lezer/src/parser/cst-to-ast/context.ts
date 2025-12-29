import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";

/**
 * Central context for CST-to-AST conversion.
 *
 * Provides utilities for navigating Lezer syntax nodes and mapping them
 * to typed AST nodes from @fossiq/kql-ast.
 */
export class CstToAstContext {
  constructor(private text: string) {}

  /**
   * Extract the text content of a syntax node.
   */
  slice(node: SyntaxNode): string {
    return this.text.slice(node.from, node.to);
  }

  /**
   * Create an error node for malformed or unexpected CST nodes.
   */
  errorNode(node: SyntaxNode, message: string): AST.ErrorNode {
    return {
      type: "ErrorNode",
      error: message,
      from: node.from,
      to: node.to,
    };
  }

  /**
   * Map a scalar expression node to an AST Expression.
   * Dispatches to appropriate handlers based on node type.
   */
  mapScalarExpression(node: SyntaxNode): AST.Expression {
    if (!node) {
      return {
        type: "ErrorNode",
        error: "Undefined node in mapScalarExpression",
        from: 0,
        to: 0,
      } as unknown as AST.Expression; // Cast to satisfy type system
    }

    switch (node.type.name) {
      case "Expression":
      case "OrExpression":
      case "AndExpression":
      case "NotExpression":
      case "ComparisonExpression":
        return this.mapLogicalOrComparisonExpression(node);
      case "AdditiveExpression":
        return this.mapAdditiveExpression(node);
      case "MultiplicativeExpression":
        return this.mapMultiplicativeExpression(node);
      case "UnaryExpression":
        return this.mapUnaryExpression(node);
      case "PrimaryExpression":
        return this.mapPrimaryExpression(node);
      default:
        // Fallback for nodes that might be directly passed (like Number, String)
        // This can happen if mapPrimaryExpression unwraps too eagerly or we pass a child directly
        if (
          [
            "Number",
            "String",
            "Identifier",
            "Timespan",
            "FunctionCall",
            "BracketedIdentifier",
          ].includes(node.type.name)
        ) {
          // Treat as primary expression content
          // We need to wrap it or handle it.
          // mapPrimaryExpression expects a wrapper node "PrimaryExpression" usually,
          // but let's see if we can reuse it logic if we fake a wrapper?
          // Better: just handle the types directly here.
          return this.mapDirectPrimitive(node);
        }

        return this.errorNode(
          node,
          `Unsupported expression type: ${node.type.name}`
        );
    }
  }

  private mapDirectPrimitive(node: SyntaxNode): AST.Expression {
    switch (node.type.name) {
      case "Number":
        return {
          type: "NumberLiteral",
          value: parseFloat(this.slice(node)),
          raw: this.slice(node),
          start: node.from,
          end: node.to,
        };
      case "String":
        return {
          type: "StringLiteral",
          value: this.parseStringLiteral(this.slice(node)),
          raw: this.slice(node),
          start: node.from,
          end: node.to,
        };
      case "Identifier":
        return {
          type: "Identifier",
          name: this.slice(node),
          start: node.from,
          end: node.to,
        };
      case "Timespan":
        return {
          type: "Literal",
          value: this.slice(node),
          raw: this.slice(node),
          start: node.from,
          end: node.to,
        };
      case "FunctionCall":
        return this.mapFunctionCall(node);
      case "BracketedIdentifier": {
        const stringNode = this.getChild(node, "String");
        const name = stringNode
          ? this.parseStringLiteral(this.slice(stringNode))
          : this.slice(node);
        return {
          type: "Identifier",
          name,
          start: node.from,
          end: node.to,
        };
      }
      default:
        return this.errorNode(node, `Unknown primitive: ${node.type.name}`);
    }
  }

  /**
   * Map logical (or/and/not) and comparison expressions.
   */
  private mapLogicalOrComparisonExpression(node: SyntaxNode): AST.Expression {
    const children = this.collectChildren(node);

    if (children.length === 1) {
      return this.mapScalarExpression(children[0]);
    }

    // Look for operators
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const name = child.type.name;

      if (name === "not") {
        const operand = children[i + 1];
        if (!operand) return this.errorNode(node, "Missing operand for 'not'");
        return {
          type: "UnaryExpression",
          operator: "not",
          operand: this.mapScalarExpression(operand),
          start: node.from,
          end: node.to,
        };
      }

      if (name === "or" || name === "and") {
        const leftNode = children[i - 1];
        const rightNode = children[i + 1];
        if (!leftNode || !rightNode) continue;
        const left = this.mapScalarExpression(leftNode);
        const right = this.mapScalarExpression(rightNode);
        return {
          type: "BinaryExpression",
          operator: name,
          left,
          right,
          start: node.from,
          end: node.to,
        };
      }

      if (name === "ComparisonOp" || name === "StringOp") {
        const leftNode = children[i - 1];
        const rightNode = children[i + 1];
        if (!leftNode || !rightNode) continue;
        const left = this.mapScalarExpression(leftNode);
        const right = this.mapScalarExpression(rightNode);
        return {
          type: "BinaryExpression",
          operator: this.slice(child),
          left,
          right,
          start: node.from,
          end: node.to,
        };
      }

      if (name === "BetweenOp") {
        const left = this.mapScalarExpression(children[i - 1]);
        const op = this.slice(child);

        // Find range expressions
        // Structure: ... BetweenOp OpenParen Expression DotDot Expression CloseParen ...
        // We scan forward for Expressions.
        const rangeParts: AST.Expression[] = [];
        for (let j = i + 1; j < children.length; j++) {
          const nextChild = children[j];
          // We accept Expression, PrimaryExpression, or primitives if the tree is flat/different
          if (
            nextChild.type.name === "Expression" ||
            nextChild.type.name === "PrimaryExpression" ||
            nextChild.type.name === "Number" ||
            nextChild.type.name === "String" ||
            nextChild.type.name === "Timespan" ||
            nextChild.type.name === "FunctionCall"
          ) {
            rangeParts.push(this.mapScalarExpression(nextChild));
            if (rangeParts.length === 2) break;
          }
        }

        if (rangeParts.length < 2) {
          return this.errorNode(
            node,
            "Between operator requires 2 range values"
          );
        }

        return {
          type: "BinaryExpression",
          operator: op,
          left,
          right: {
            type: "BinaryExpression",
            operator: "..",
            left: rangeParts[0],
            right: rangeParts[1],
            start: node.from,
            end: node.to,
          },
          start: node.from,
          end: node.to,
        };
      }
    }

    if (children.length > 0) {
      return this.mapScalarExpression(children[0]);
    }

    return this.errorNode(node, "Empty logical/comparison expression");
  }

  /**
   * Map a unary expression.
   */
  private mapUnaryExpression(node: SyntaxNode): AST.Expression {
    const children = this.collectChildren(node);

    if (children.length >= 2 && children[0].type.name === "Minus") {
      return {
        type: "UnaryExpression",
        operator: "-",
        operand: this.mapScalarExpression(children[1]),
        start: node.from,
        end: node.to,
      };
    }

    if (children.length === 1) {
      return this.mapScalarExpression(children[0]);
    }

    return this.errorNode(node, "Invalid unary expression");
  }

  /**
   * Map an additive expression (+ or -).
   */
  private mapAdditiveExpression(node: SyntaxNode): AST.Expression {
    const children = this.collectChildren(node);

    // If there's only one child, it's just a multiplicative expression
    if (children.length === 1) {
      return this.mapScalarExpression(children[0]);
    }

    // Build left-associative binary expression tree
    let left = this.mapScalarExpression(children[0]);
    let i = 1;

    while (i < children.length) {
      const opNode = children[i];
      const rightNode = children[i + 1];
      if (!rightNode) break; // Safety

      const op = this.slice(opNode);
      const right = this.mapScalarExpression(rightNode);

      left = {
        type: "BinaryExpression",
        operator: op as "+" | "-",
        left,
        right,
        start: node.from,
        end: node.to,
      };

      i += 2;
    }

    return left;
  }

  /**
   * Map a multiplicative expression (*, /, %).
   */
  private mapMultiplicativeExpression(node: SyntaxNode): AST.Expression {
    const children = this.collectChildren(node);

    // If there's only one child, it's just a primary expression
    if (children.length === 1) {
      return this.mapScalarExpression(children[0]);
    }

    // Build left-associative binary expression tree
    let left = this.mapScalarExpression(children[0]);
    let i = 1;

    while (i < children.length) {
      const opNode = children[i];
      const rightNode = children[i + 1];
      if (!rightNode) break;

      const op = this.slice(opNode);
      const right = this.mapScalarExpression(rightNode);

      left = {
        type: "BinaryExpression",
        operator: op as "*" | "/" | "%",
        left,
        right,
        start: node.from,
        end: node.to,
      };

      i += 2;
    }

    return left;
  }

  /**
   * Map a primary expression (literal, identifier, or parenthesized).
   */
  private mapPrimaryExpression(node: SyntaxNode): AST.Expression {
    const child = node.firstChild;
    if (!child) {
      return this.errorNode(node, "Empty primary expression");
    }

    // Delegate to direct primitive mapper for consistency
    return this.mapDirectPrimitive(child);
  }

  /**
   * Map a FunctionCall node.
   */
  private mapFunctionCall(node: SyntaxNode): AST.FunctionCall | AST.ErrorNode {
    const identNode = this.getChild(node, "Identifier");
    if (!identNode) {
      return this.errorNode(
        node,
        "FunctionCall missing identifier"
      ) as unknown as AST.FunctionCall;
    }

    const args: AST.Expression[] = [];
    const argListNode = this.getChild(node, "ArgumentList");
    if (argListNode) {
      const exprs = this.getChildren(argListNode, "Expression");
      for (const expr of exprs) {
        args.push(this.mapScalarExpression(expr));
      }
    }

    return {
      type: "FunctionCall",
      name: this.slice(identNode),
      args,
      start: node.from,
      end: node.to,
    };
  }

  /**
   * Parse a KQL string literal, removing quotes and handling escape sequences.
   */
  parseStringLiteral(raw: string): string {
    // Handle verbatim strings @"..." or @'...'
    if (raw.startsWith('@"') && raw.endsWith('"')) {
      return raw.slice(2, -1);
    }
    if (raw.startsWith("@'") && raw.endsWith("'")) {
      return raw.slice(2, -1);
    }

    // Handle obfuscated strings h"..." or h@"..."
    if (raw.startsWith('h@"') && raw.endsWith('"')) {
      return raw.slice(3, -1);
    }
    if (raw.startsWith('h"') && raw.endsWith('"')) {
      return raw.slice(2, -1);
    }

    // Handle regular strings "..." or '...'
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      // Simple unescape (handle \", \', \\, \n, \t, \r)
      return raw
        .slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\'/g, "'")
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");
    }

    return raw;
  }

  /**
   * Collect all direct children of a node as an array.
   */
  private collectChildren(node: SyntaxNode): SyntaxNode[] {
    const children: SyntaxNode[] = [];
    let child = node.firstChild;
    while (child) {
      children.push(child);
      child = child.nextSibling;
    }
    return children;
  }

  /**
   * Find a child node by type name.
   */
  getChild(node: SyntaxNode, typeName: string): SyntaxNode | null {
    let child = node.firstChild;
    while (child) {
      if (child.type.name === typeName) {
        return child;
      }
      child = child.nextSibling;
    }
    return null;
  }

  /**
   * Find all children of a given type.
   */
  getChildren(node: SyntaxNode, typeName: string): SyntaxNode[] {
    const children: SyntaxNode[] = [];
    let child = node.firstChild;
    while (child) {
      if (child.type.name === typeName) {
        children.push(child);
      }
      child = child.nextSibling;
    }
    return children;
  }
}
