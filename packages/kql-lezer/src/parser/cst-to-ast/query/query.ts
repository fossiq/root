import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";
import { mapLetStatements } from "./let";
import { mapSetStatements } from "./set";
import { mapDeclareParameters } from "./parameters";
import { mapQueryExpression } from "./expression";

export function mapQuery(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.Query | AST.ErrorNode {
  const letStatementsResult = mapLetStatements(node, ctx);
  if (!Array.isArray(letStatementsResult)) return letStatementsResult;

  const setStatements = mapSetStatements(node, ctx);
  const declareParameters = mapDeclareParameters(node, ctx);

  const queryExprNode = ctx.getChild(node, "QueryExpression");
  if (!queryExprNode) {
    return ctx.errorNode(node, "Query missing QueryExpression");
  }

  const expression = mapQueryExpression(queryExprNode, ctx);
  if (expression.type === "ErrorNode") return expression;

  const query: AST.Query = {
    type: "Query",
    letStatements: letStatementsResult,
    setStatements,
    declareParameters,
    expression,
    start: node.from,
    end: node.to,
  };

  if (expression.type === "PipelineExpression") {
    query.pipeline = expression;
  }

  return query;
}
