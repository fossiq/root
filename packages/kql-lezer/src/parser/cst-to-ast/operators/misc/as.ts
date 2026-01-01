import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapAsOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.AsOperator | AST.ErrorNode {
  const identifiers = ctx.getChildren(node, "Identifier");
  const nameNode = identifiers[identifiers.length - 1];

  if (!nameNode) return ctx.errorNode(node, "As missing alias");

  let materialized: boolean | undefined;
  const hintNode = ctx.getChild(node, "AsHint");
  if (hintNode) {
    if (ctx.getChild(hintNode, "true")) materialized = true;
    if (ctx.getChild(hintNode, "false")) materialized = false;
  }

  return {
    type: "AsOperator",
    name: ctx.slice(nameNode),
    materialized,
    start: node.from,
    end: node.to,
  };
}
