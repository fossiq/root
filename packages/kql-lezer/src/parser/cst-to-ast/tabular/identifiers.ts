import { SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "../context";

export function mapIdentifierList(
  node: SyntaxNode,
  ctx: CstToAstContext
): string[] {
  const columns: string[] = [];
  const listNode = ctx.getChild(node, "IdentifierList");
  if (listNode) {
    const identifiers = ctx.getChildren(listNode, "Identifier");
    for (const ident of identifiers) {
      columns.push(ctx.slice(ident));
    }
  }
  return columns;
}
