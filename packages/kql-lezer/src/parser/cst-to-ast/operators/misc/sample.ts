import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapSampleOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.SampleOperator | AST.ErrorNode {
  const exprNode = ctx.getChild(node, "Expression");
  if (!exprNode) return ctx.errorNode(node, "Sample missing count expression");

  const kindNode = ctx.getChild(node, "Identifier");

  return {
    type: "SampleOperator",
    count: ctx.mapScalarExpression(exprNode),
    kind: kindNode ? ctx.slice(kindNode) : undefined,
    start: node.from,
    end: node.to,
  };
}
