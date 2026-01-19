import { Tree } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "./context";
import { mapQuery } from "./query/query";

/**
 * Convert a Lezer parse tree (CST) to a KQL AST.
 *
 * This is the main entry point for CST-to-AST conversion.
 */
export function cstToAst(tree: Tree, text: string): AST.Query | AST.ErrorNode {
  const ctx = new CstToAstContext(text);
  const topNode = tree.topNode;

  if (topNode.type.name !== "KQL") {
    return ctx.errorNode(
      topNode,
      `Expected KQL node, got ${topNode.type.name}`
    );
  }

  const queryNode = ctx.getChild(topNode, "Query");
  if (!queryNode) {
    return ctx.errorNode(topNode, "KQL missing Query node");
  }

  return mapQuery(queryNode, ctx);
}

export { CstToAstContext };
