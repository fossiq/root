import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapEvaluateOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.EvaluateOperator | AST.ErrorNode {
  const funcNode = ctx.getChild(node, "FunctionCall");
  if (!funcNode) return ctx.errorNode(node, "Evaluate missing plugin call");

  const call = ctx.mapFunctionCall(funcNode);
  if (call.type === "ErrorNode") return call;

  return {
    type: "EvaluateOperator",
    plugin: call,
    start: node.from,
    end: node.to,
  };
}
