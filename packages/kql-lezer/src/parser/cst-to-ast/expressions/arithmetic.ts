import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { MapperContext } from "../context";
import { collectChildren } from "../utils";

export function mapAdditiveExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const children = collectChildren(node);

  if (children.length === 1) {
    return ctx.mapScalarExpression(children[0]);
  }

  let left = ctx.mapScalarExpression(children[0]);
  let i = 1;

  while (i < children.length) {
    const opNode = children[i];
    const rightNode = children[i + 1];
    if (!rightNode) break;

    const op = ctx.slice(opNode);
    const right = ctx.mapScalarExpression(rightNode);

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

export function mapMultiplicativeExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const children = collectChildren(node);

  if (children.length === 1) {
    return ctx.mapScalarExpression(children[0]);
  }

  let left = ctx.mapScalarExpression(children[0]);
  let i = 1;

  while (i < children.length) {
    const opNode = children[i];
    const rightNode = children[i + 1];
    if (!rightNode) break;

    const op = ctx.slice(opNode);
    const right = ctx.mapScalarExpression(rightNode);

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
