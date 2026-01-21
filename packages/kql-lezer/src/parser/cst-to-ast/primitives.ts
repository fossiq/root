import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { MapperContext } from "./context";
import { createErrorNode, parseStringLiteral } from "./utils";

/**
 * Map basic primitive nodes (literals and identifiers).
 */
export function mapPrimitive(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const { slice, getChild } = ctx;

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
    case "ArrayLiteral":
      return mapArrayLiteral(node, ctx);
    default:
      return createErrorNode(node, `Unknown primitive: ${node.type.name}`);
  }
}

/**
 * Map an ArrayLiteral node.
 */
export function mapArrayLiteral(
  node: SyntaxNode,
  ctx: MapperContext
): AST.ArrayLiteral | AST.ErrorNode {
  const { getChildren } = ctx;

  const elements: AST.Expression[] = [];
  const exprs = getChildren(node, "Expression");
  for (const expr of exprs) {
    elements.push(ctx.mapScalarExpression(expr));
  }

  return {
    type: "ArrayLiteral",
    elements,
    start: node.from,
    end: node.to,
  };
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
      args.push(ctx.mapScalarExpression(expr));
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
  ctx: MapperContext
): AST.Expression {
  const child = node.firstChild;
  if (!child) {
    return createErrorNode(node, "Empty primary expression");
  }

  return mapPrimitive(child, ctx);
}
