import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";
import { mapTableExpression } from "../query-expressions";

export function mapUnionClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const tableListNode = ctx.getChild(node, "TableList");
  if (!tableListNode) {
    return ctx.errorNode(node, "UnionClause missing table list");
  }

  const tableNodes = ctx.getChildren(tableListNode, "TableExpression");
  const tables = tableNodes.map((t) => mapTableExpression(t, ctx));

  for (const t of tables) {
    if (t.type === "ErrorNode") return t;
  }

  let kind: string | undefined;
  let withSource: string | undefined;

  const paramsNode = ctx.getChild(node, "UnionParameters");
  if (paramsNode) {
    const kindToken = ctx.getChild(paramsNode, "kind");
    if (kindToken) {
      const kindVal = paramsNode.getChild("JoinKind");
      if (kindVal) kind = ctx.slice(kindVal);
    }
    const sourceToken = ctx.getChild(paramsNode, "withsource");
    if (sourceToken) {
      const idNode = paramsNode.getChild("Identifier");
      if (idNode) withSource = ctx.slice(idNode);
    }
  }

  return {
    type: "UnionOperator",
    tables: tables as (AST.TableSource | AST.PipelineExpression)[],
    kind,
    withSource,
    start: node.from,
    end: node.to,
  };
}
