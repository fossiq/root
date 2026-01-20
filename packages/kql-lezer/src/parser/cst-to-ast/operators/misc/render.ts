import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapRenderOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.RenderOperator | AST.ErrorNode {
  const typeNode = ctx.getChild(node, "Identifier");
  if (!typeNode) return ctx.errorNode(node, "Render missing chart type");

  const options: Record<string, string> = {};
  const propsNode = ctx.getChild(node, "RenderProperties");
  if (propsNode) {
    const items = ctx.getChildren(propsNode, "ProjectExpressionItem");
    for (const item of items) {
      const id = ctx.getChild(item, "Identifier");
      const expr = ctx.getChild(item, "Expression");
      if (id && expr) {
        options[ctx.slice(id)] = ctx.slice(expr);
      }
    }
  }

  return {
    type: "RenderOperator",
    chartType: ctx.slice(typeNode),
    options,
    start: node.from,
    end: node.to,
  };
}
