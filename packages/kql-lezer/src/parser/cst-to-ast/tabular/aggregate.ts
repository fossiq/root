import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";
import { mapIdentifierList } from "./identifiers";

export function mapDistinctClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const columns = mapIdentifierList(node, ctx);
  return {
    type: "DistinctOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}

export function mapSummarizeClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const aggregations: AST.Aggregation[] = [];
  const aggListNode = ctx.getChild(node, "AggregationList");
  if (aggListNode) {
    const items = ctx.getChildren(aggListNode, "AggregationItem");
    for (const item of items) {
      const identNode = ctx.getChild(item, "Identifier");
      const funcNode = ctx.getChild(item, "FunctionCall");
      aggregations.push({
        type: "Aggregation",
        alias: identNode ? ctx.slice(identNode) : undefined,
        function: funcNode
          ? ctx.mapFunctionCall(funcNode)
          : ctx.errorNode(item, "Missing aggregation function"),
        start: item.from,
        end: item.to,
      });
    }
  }

  const groupBy: AST.Expression[] = [];
  const groupByNode = ctx.getChild(node, "GroupByList");
  if (groupByNode) {
    const exprs = ctx.getChildren(groupByNode, "Expression");
    for (const expr of exprs) {
      groupBy.push(ctx.mapScalarExpression(expr));
    }
  }

  return {
    type: "SummarizeOperator",
    aggregations,
    by: groupBy,
    start: node.from,
    end: node.to,
  };
}

export function mapMvExpandClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const columns = mapIdentifierList(node, ctx);
  return {
    type: "MvExpandOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}
