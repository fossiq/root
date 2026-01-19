import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapRangeOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.RangeOperator | AST.ErrorNode {
  const nameNode = ctx.getChild(node, "Identifier");
  const exprNodes = ctx.getChildren(node, "Expression");

  if (!nameNode || exprNodes.length < 3) {
    return ctx.errorNode(node, "Range missing name or bounds");
  }

  const [fromNode, toNode, stepNode] = exprNodes;

  return {
    type: "RangeOperator",
    name: ctx.slice(nameNode),
    from: ctx.mapScalarExpression(fromNode),
    to: ctx.mapScalarExpression(toNode),
    step: ctx.mapScalarExpression(stepNode),
    start: node.from,
    end: node.to,
  };
}
