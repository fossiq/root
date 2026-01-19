import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";

export function mapLetStatement(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.LetStatement | AST.ErrorNode {
  const identifierNode = ctx.getChild(node, "Identifier");
  if (!identifierNode) {
    return ctx.errorNode(node, "LetStatement missing identifier");
  }

  const exprNode = ctx.getChild(node, "Expression");
  if (!exprNode) {
    return ctx.errorNode(node, "LetStatement missing expression");
  }

  return {
    type: "LetStatement",
    name: ctx.slice(identifierNode),
    value: ctx.mapScalarExpression(exprNode),
    start: node.from,
    end: node.to,
  };
}

export function mapLetStatements(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.LetStatement[] | AST.ErrorNode {
  const letStatements: AST.LetStatement[] = [];
  const letNodes = ctx.getChildren(node, "LetStatement");
  for (const letNode of letNodes) {
    const letStmt = mapLetStatement(letNode, ctx);
    if (letStmt.type === "ErrorNode") return letStmt;
    letStatements.push(letStmt as AST.LetStatement);
  }
  return letStatements;
}
