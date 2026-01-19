import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapMakeSeriesOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.MakeSeriesOperator | AST.ErrorNode {
  const aggList = ctx.getChild(node, "AggregationList");
  const aggregations: AST.Aggregation[] = [];
  if (aggList) {
    const items = ctx.getChildren(aggList, "AggregationItem");
    for (const item of items) {
      const identNode = ctx.getChild(item, "Identifier");
      const funcNode = ctx.getChild(item, "FunctionCall");
      if (funcNode) {
        aggregations.push({
          type: "Aggregation",
          alias: identNode ? ctx.slice(identNode) : undefined,
          function: ctx.mapFunctionCall(funcNode) as AST.FunctionCall,
          start: item.from,
          end: item.to,
        });
      }
    }
  }

  return {
    type: "MakeSeriesOperator",
    aggregations,
    on: {} as AST.SortExpression,
    step: {} as AST.Expression,
    start: node.from,
    end: node.to,
  };
}
