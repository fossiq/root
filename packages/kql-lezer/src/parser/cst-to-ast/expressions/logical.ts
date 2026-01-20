import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { MapperContext } from "../context";
import { createErrorNode, collectChildren } from "../utils";

export function mapLogicalOrComparisonExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  const { slice } = ctx;
  const children = collectChildren(node);

  if (children.length === 1) {
    return ctx.mapScalarExpression(children[0]);
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const name = child.type.name;

    if (name === "not") {
      const operand = children[i + 1];
      if (!operand) return createErrorNode(node, "Missing operand for 'not'");
      return {
        type: "UnaryExpression",
        operator: "not",
        operand: ctx.mapScalarExpression(operand),
        start: node.from,
        end: node.to,
      };
    }

    if (name === "or" || name === "and") {
      const leftNode = children[i - 1];
      const rightNode = children[i + 1];
      if (!leftNode || !rightNode) continue;
      const left = ctx.mapScalarExpression(leftNode);
      const right = ctx.mapScalarExpression(rightNode);
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
      const left = ctx.mapScalarExpression(leftNode);
      const right = ctx.mapScalarExpression(rightNode);
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
      const left = ctx.mapScalarExpression(children[i - 1]);
      const op = slice(child);

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
          rangeParts.push(ctx.mapScalarExpression(nextChild));
          if (rangeParts.length === 2) break;
        }
      }

      if (rangeParts.length < 2) {
        return createErrorNode(node, "Between operator requires 2 range values");
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
    return ctx.mapScalarExpression(children[0]);
  }

  return createErrorNode(node, "Empty logical/comparison expression");
}
