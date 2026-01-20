import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapPrintOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.PrintOperator | AST.ErrorNode {
  const listNode = ctx.getChild(node, "ProjectItemList");
  if (listNode) {
    // ProjectItemList -> Identifier (Comma Identifier)*
    // Grammar may eventually expand to expressions; keep placeholder logic.
  }

  return {
    type: "PrintOperator",
    expressions: [],
    start: node.from,
    end: node.to,
  };
}
