import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapSerializeOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.SerializeOperator {
  const columns: string[] = [];
  const listNode = ctx.getChild(node, "IdentifierList");
  if (listNode) {
    const identifiers = ctx.getChildren(listNode, "Identifier");
    for (const id of identifiers) columns.push(ctx.slice(id));
  }
  return {
    type: "SerializeOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}
