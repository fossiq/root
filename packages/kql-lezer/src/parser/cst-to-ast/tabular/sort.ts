import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";

export function mapSortClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const expressions: AST.SortExpression[] = [];
  const listNode = ctx.getChild(node, "SortExpressionList");
  if (listNode) {
    const items = ctx.getChildren(listNode, "SortExpressionItem");
    for (const item of items) {
      const exprNode = ctx.getChild(item, "Expression");
      const dirNode = ctx.getChild(item, "SortDirection");
      const nullsNode = ctx.getChild(item, "NullsPosition");

      expressions.push({
        type: "SortExpression",
        expression: exprNode
          ? ctx.mapScalarExpression(exprNode)
          : ctx.errorNode(item, "Missing sort expression"),
        direction: dirNode ? ctx.slice(dirNode) : undefined,
        nulls: nullsNode ? ctx.slice(nullsNode) : undefined,
        start: item.from,
        end: item.to,
      });
    }
  }

  return {
    type: "SortOperator",
    expressions,
    start: node.from,
    end: node.to,
  };
}

export function mapLimitClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const exprNode = ctx.getChild(node, "Expression");
  return {
    type: node.type.name === "LimitClause" ? "LimitOperator" : "TakeOperator",
    count: exprNode
      ? ctx.mapScalarExpression(exprNode)
      : ctx.errorNode(node, "Missing limit expression"),
    start: node.from,
    end: node.to,
  };
}

export function mapTopClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const exprNode = ctx.getChild(node, "Expression");
  const sortList = ctx.getChild(node, "SortExpressionList");

  const byExpressions: AST.SortExpression[] = [];
  if (sortList) {
    const items = ctx.getChildren(sortList, "SortExpressionItem");
    for (const item of items) {
      const itemExpr = ctx.getChild(item, "Expression");
      const dirNode = ctx.getChild(item, "SortDirection");
      const nullsNode = ctx.getChild(item, "NullsPosition");

      byExpressions.push({
        type: "SortExpression",
        expression: itemExpr
          ? ctx.mapScalarExpression(itemExpr)
          : ctx.errorNode(item, "Missing sort expression"),
        direction: dirNode ? ctx.slice(dirNode) : undefined,
        nulls: nullsNode ? ctx.slice(nullsNode) : undefined,
        start: item.from,
        end: item.to,
      });
    }
  }

  return {
    type: "TopOperator",
    count: exprNode
      ? ctx.mapScalarExpression(exprNode)
      : ctx.errorNode(node, "Missing top count"),
    by: byExpressions,
    start: node.from,
    end: node.to,
  };
}
