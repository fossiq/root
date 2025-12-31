import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";

/**
 * Pure functional versions of CST-to-AST mapping functions.
 * All functions accept (node, text) parameters for dependency injection.
 */

export interface MapperContext {
  slice: (node: SyntaxNode) => string;
  getChild: (node: SyntaxNode, typeName: string) => SyntaxNode | null;
  getChildren: (node: SyntaxNode, typeName: string) => SyntaxNode[];
  parseStringLiteral: (raw: string) => string;
}

/**
 * Create a context object with utility functions.
 */
export function createMapperContext(text: string): MapperContext {
  return {
    slice: (node: SyntaxNode) => text.slice(node.from, node.to),
    getChild: (node: SyntaxNode, typeName: string): SyntaxNode | null => {
      let child = node.firstChild;
      while (child) {
        if (child.type.name === typeName) {
          return child;
        }
        child = child.nextSibling;
      }
      return null;
    },
    getChildren: (node: SyntaxNode, typeName: string): SyntaxNode[] => {
      const children: SyntaxNode[] = [];
      let child = node.firstChild;
      while (child) {
        if (child.type.name === typeName) {
          children.push(child);
        }
        child = child.nextSibling;
      }
      return children;
    },
    parseStringLiteral,
  };
}

/**
 * Create an error node.
 */
export function createErrorNode(node: SyntaxNode, message: string): AST.ErrorNode {
  return {
    type: "ErrorNode",
    error: message,
    from: node.from,
    to: node.to,
  };
}

/**
 * Parse a KQL string literal.
 */
export function parseStringLiteral(raw: string): string {
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
        .replace(/'/g, "'")
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");
    }
  return raw;
}

/**
 * Map basic primitive nodes (literals and identifiers).
 */
export function mapPrimitive(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const { slice, getChild, parseStringLiteral } = ctx;

  switch (node.type.name) {
    case "Number":
      return {
        type: "NumberLiteral",
        value: parseFloat(slice(node)),
        raw: slice(node),
        start: node.from,
        end: node.to,
      };
    case "String":
      return {
        type: "StringLiteral",
        value: parseStringLiteral(slice(node)),
        raw: slice(node),
        start: node.from,
        end: node.to,
      };
    case "Identifier":
      return {
        type: "Identifier",
        name: slice(node),
        start: node.from,
        end: node.to,
      };
    case "Timespan":
      return {
        type: "Literal",
        value: slice(node),
        raw: slice(node),
        start: node.from,
        end: node.to,
      };
    case "FunctionCall":
      return mapFunctionCall(node, ctx);
    case "BracketedIdentifier": {
      const stringNode = getChild(node, "String");
      const name = stringNode
        ? parseStringLiteral(slice(stringNode))
        : slice(node);
      return {
        type: "Identifier",
        name,
        start: node.from,
        end: node.to,
      };
    }
    case "true":
    case "false":
      return {
        type: "Literal",
        value: node.type.name === "true",
        raw: slice(node),
        start: node.from,
        end: node.to,
      };
    case "null":
      return {
        type: "Literal",
        value: null,
        raw: slice(node),
        start: node.from,
        end: node.to,
      };
    default:
      return createErrorNode(node, `Unknown primitive: ${node.type.name}`);
  }
}

/**
 * Map a FunctionCall node.
 */
export function mapFunctionCall(
  node: SyntaxNode,
  ctx: MapperContext
): AST.FunctionCall | AST.ErrorNode {
  const { slice, getChild, getChildren } = ctx;

  const identNode = getChild(node, "Identifier");
  if (!identNode) {
    return createErrorNode(node, "FunctionCall missing identifier");
  }

  const args: AST.Expression[] = [];
  const argListNode = getChild(node, "ArgumentList");
  if (argListNode) {
    const exprs = getChildren(argListNode, "Expression");
    for (const expr of exprs) {
      args.push(mapScalarExpression(expr, ctx));
    }
  }

  return {
    type: "FunctionCall",
    name: slice(identNode),
    args,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a primary expression (parenthesized or direct).
 */
export function mapPrimaryExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.Expression {
  const child = node.firstChild;
  if (!child) {
    return createErrorNode(node, "Empty primary expression");
  }

  return mapPrimitive(child, ctx);
}

/**
 * Map unary expressions (-, not).
 */
export function mapUnaryExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const children = Array.from(node.firstChild ? [node.firstChild] : []);
  let child = node.firstChild;
  while (child) {
    children.push(child);
    child = child.nextSibling;
  }

  if (children.length >= 2 && children[0].type.name === "Minus") {
    return {
      type: "UnaryExpression",
      operator: "-",
      operand: mapScalarExpression(children[1], ctx),
      start: node.from,
      end: node.to,
    };
  }

  if (children.length === 1) {
    return mapScalarExpression(children[0], ctx);
  }

  return createErrorNode(node, "Invalid unary expression");
}

/**
 * Collect all direct children of a node.
 */
function collectChildren(node: SyntaxNode): SyntaxNode[] {
  const children: SyntaxNode[] = [];
  let child = node.firstChild;
  while (child) {
    children.push(child);
    child = child.nextSibling;
  }
  return children;
}

/**
 * Map an additive expression (+ or -).
 */
export function mapAdditiveExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const children = collectChildren(node);

  // If only one child, it's a multiplicative expression
  if (children.length === 1) {
    return mapScalarExpression(children[0], ctx);
  }

  // Build left-associative binary expression tree
  let left = mapScalarExpression(children[0], ctx);
  let i = 1;

  while (i < children.length) {
    const opNode = children[i];
    const rightNode = children[i + 1];
    if (!rightNode) break;

    const op = ctx.slice(opNode);
    const right = mapScalarExpression(rightNode, ctx);

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
export function mapMultiplicativeExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const children = collectChildren(node);

  // If only one child, it's a primary expression
  if (children.length === 1) {
    return mapScalarExpression(children[0], ctx);
  }

  // Build left-associative binary expression tree
  let left = mapScalarExpression(children[0], ctx);
  let i = 1;

  while (i < children.length) {
    const opNode = children[i];
    const rightNode = children[i + 1];
    if (!rightNode) break;

    const op = ctx.slice(opNode);
    const right = mapScalarExpression(rightNode, ctx);

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
 * Map logical, comparison, and between expressions.
 */
export function mapLogicalOrComparisonExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const { slice } = ctx;
  const children = collectChildren(node);

  if (children.length === 1) {
    return mapScalarExpression(children[0], ctx);
  }

  // Look for operators
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const name = child.type.name;

    if (name === "not") {
      const operand = children[i + 1];
      if (!operand) return createErrorNode(node, "Missing operand for 'not'");
      return {
        type: "UnaryExpression",
        operator: "not",
        operand: mapScalarExpression(operand, ctx),
        start: node.from,
        end: node.to,
      };
    }

    if (name === "or" || name === "and") {
      const leftNode = children[i - 1];
      const rightNode = children[i + 1];
      if (!leftNode || !rightNode) continue;
      const left = mapScalarExpression(leftNode, ctx);
      const right = mapScalarExpression(rightNode, ctx);
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
      const left = mapScalarExpression(leftNode, ctx);
      const right = mapScalarExpression(rightNode, ctx);
      return {
        type: "BinaryExpression",
        operator: slice(child),
        left,
        right,
        start: node.from,
        end: node.to,
      };
    }

    if (name === "BetweenOp") {
      const left = mapScalarExpression(children[i - 1], ctx);
      const op = slice(child);

      // Find range expressions
      const rangeParts: AST.Expression[] = [];
      for (let j = i + 1; j < children.length; j++) {
        const nextChild = children[j];
        if (
          nextChild.type.name === "Expression" ||
          nextChild.type.name === "PrimaryExpression" ||
          nextChild.type.name === "Number" ||
          nextChild.type.name === "String" ||
          nextChild.type.name === "Timespan" ||
          nextChild.type.name === "FunctionCall"
        ) {
          rangeParts.push(mapScalarExpression(nextChild, ctx));
          if (rangeParts.length === 2) break;
        }
      }

      if (rangeParts.length < 2) {
        return createErrorNode(
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
    return mapScalarExpression(children[0], ctx);
  }

  return createErrorNode(node, "Empty logical/comparison expression");
}

/**
 * Main dispatcher for scalar expressions.
 */
export function mapScalarExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  if (!node) {
    return createErrorNode({ from: 0, to: 0 } as SyntaxNode, "Undefined node in mapScalarExpression");
  }

  switch (node.type.name) {
    case "Expression":
    case "OrExpression":
    case "AndExpression":
    case "NotExpression":
    case "ComparisonExpression":
      return mapLogicalOrComparisonExpression(node, ctx);
    case "AdditiveExpression":
      return mapAdditiveExpression(node, ctx);
    case "MultiplicativeExpression":
      return mapMultiplicativeExpression(node, ctx);
    case "UnaryExpression":
      return mapUnaryExpression(node, ctx);
    case "PrimaryExpression":
      return mapPrimaryExpression(node, ctx);
    default:
      // Fallback for direct primitive nodes
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
        return mapPrimitive(node, ctx);
      }

      return createErrorNode(
        node,
        `Unsupported expression type: ${node.type.name}`
      );
  }
}