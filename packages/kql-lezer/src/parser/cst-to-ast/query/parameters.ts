import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";

export function mapDeclareParameters(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.DeclareQueryParametersStatement[] {
  const declareParameters: AST.DeclareQueryParametersStatement[] = [];
  const declareNodes = ctx.getChildren(node, "DeclareQueryParametersStatement");

  for (const d of declareNodes) {
    const listNode = ctx.getChild(d, "QueryParameterList");
    const parameters: AST.QueryParameter[] = [];
    if (listNode) {
      const params = ctx.getChildren(listNode, "QueryParameter");
      for (const p of params) {
        const ids = ctx.getChildren(p, "Identifier");
        const expr = ctx.getChild(p, "Expression");
        if (ids.length >= 2) {
          parameters.push({
            type: "QueryParameter",
            name: ctx.slice(ids[0]),
            paramType: ctx.slice(ids[1]),
            defaultValue: expr ? ctx.mapScalarExpression(expr) : undefined,
            start: p.from,
            end: p.to,
          });
        }
      }
    }

    declareParameters.push({
      type: "DeclareQueryParametersStatement",
      parameters,
      start: d.from,
      end: d.to,
    });
  }

  return declareParameters;
}
