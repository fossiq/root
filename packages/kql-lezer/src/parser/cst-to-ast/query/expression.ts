import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";
import {
  mapFindExpression,
  mapPipelineExpression,
  mapSearchExpression,
  mapUnionExpression,
} from "../query-expressions";

export function mapQueryExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.QueryExpression | AST.ErrorNode {
  const firstChild = node.firstChild;
  if (!firstChild) return ctx.errorNode(node, "Empty QueryExpression");

  switch (firstChild.type.name) {
    case "PipelineExpression":
      return mapPipelineExpression(firstChild, ctx);
    case "UnionExpression":
      return mapUnionExpression(firstChild, ctx);
    case "SearchExpression":
      return mapSearchExpression(firstChild, ctx);
    case "FindExpression":
      return mapFindExpression(firstChild, ctx);
    default:
      return ctx.errorNode(
        firstChild,
        `Unsupported query expression type: ${firstChild.type.name}`
      );
  }
}
