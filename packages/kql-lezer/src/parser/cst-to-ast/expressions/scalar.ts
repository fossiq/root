import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { MapperContext } from "../context";
import { createErrorNode } from "../utils";
import { mapPrimaryExpression, mapPrimitive } from "../primitives";
import { mapAdditiveExpression, mapMultiplicativeExpression } from "./arithmetic";
import { mapLogicalOrComparisonExpression } from "./logical";
import { mapUnaryExpression } from "./unary";

export function mapScalarExpression(
  node: SyntaxNode,
  ctx: MapperContext
): AST.Expression {
  if (!node) {
    return createErrorNode(
      { from: 0, to: 0 } as SyntaxNode,
      "Undefined node in mapScalarExpression"
    );
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
