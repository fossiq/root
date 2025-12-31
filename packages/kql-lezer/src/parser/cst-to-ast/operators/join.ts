import { SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "../context";
import type * as AST from "@fossiq/kql-ast";
import { mapTableExpression } from "../index";

export function mapJoinOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.JoinOperator | AST.ErrorNode {
  // JoinClause: kw("join") optional(JoinParameters) TableExpression kw("on") JoinConditionList
  
  const kindNode = ctx.getChild(node, "JoinKind");
  const kind = kindNode ? ctx.slice(kindNode) : undefined;

  const tableNode = ctx.getChild(node, "TableExpression");
  if (!tableNode) return ctx.errorNode(node, "Join missing table");

  const rightTable = mapTableExpression(tableNode, ctx);
  if (rightTable.type === "ErrorNode") return rightTable;

  const conditionList = ctx.getChild(node, "JoinConditionList");
  const onExpressions: AST.Expression[] = [];
  if (conditionList) {
      const exprs = ctx.getChildren(conditionList, "Expression");
      for (const expr of exprs) {
          onExpressions.push(ctx.mapScalarExpression(expr));
      }
  }

  return {
    type: "JoinOperator",
    kind,
    rightTable,
    on: onExpressions,
    start: node.from,
    end: node.to,
  };
}

export function mapLookupOperator(
    node: SyntaxNode,
    ctx: CstToAstContext
  ): AST.JoinOperator | AST.ErrorNode {
    // LookupClause is same structure as JoinClause roughly, mapped to JoinOperator with kind="lookup" usually or its own type?
    // KQL AST usually treats lookup as a join with specialized behavior. 
    // But let's map it to JoinOperator for now or add LookupOperator to AST?
    // AST doesn't have LookupOperator in my update. Implementation guide says "lookup -> join".
    // I will map it to JoinOperator with kind="lookup" implicit or explicit.
    
    // Using mapJoinOperator logic but forcing kind="lookup" if not present?
    // Or just reusing mapJoinOperator logic.
    // The node structure is similar.
    
    return mapJoinOperator(node, ctx);
}
