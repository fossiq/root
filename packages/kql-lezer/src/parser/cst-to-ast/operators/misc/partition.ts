import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";
import { mapPipelineExpression } from "../../query-expressions";

export function mapPartitionOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.PartitionOperator | AST.ErrorNode {
  const idNode = ctx.getChild(node, "Identifier");
  const pipeNode = ctx.getChild(node, "PipelineExpression");

  if (!idNode || !pipeNode) {
    return ctx.errorNode(node, "Partition missing column or sub-query");
  }

  const subQuery = mapPipelineExpression(pipeNode, ctx);
  if (subQuery.type === "ErrorNode") return subQuery;

  return {
    type: "PartitionOperator",
    by: ctx.slice(idNode),
    pipeline: subQuery,
    start: node.from,
    end: node.to,
  };
}
