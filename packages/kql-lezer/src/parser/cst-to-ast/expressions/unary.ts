import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { MapperContext } from "../context";
import { createErrorNode } from "../utils";

export function mapUnaryExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const children = [] as SyntaxNode[];
  let child = node.firstChild;
  while (child) {
    children.push(child);
    child = child.nextSibling;
  }

  if (children.length >= 2 && children[0].type.name === "Minus") {
    return {
      type: "UnaryExpression",
      operator: "-",
      operand: ctx.mapScalarExpression(children[1]),
      start: node.from,
      end: node.to,
    };
  }

  if (children.length === 1) {
    return ctx.mapScalarExpression(children[0]);
  }

  return createErrorNode(node, "Invalid unary expression");
}
