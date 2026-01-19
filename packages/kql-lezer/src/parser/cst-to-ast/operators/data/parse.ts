import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

export function mapParseOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.ParseOperator | AST.ErrorNode {
  const exprNode = ctx.getChild(node, "Expression");
  const patternNode = ctx.getChild(node, "String");
  const kindNode = ctx.getChild(node, "ParseKind");

  if (!exprNode || !patternNode) {
    return ctx.errorNode(node, "Parse missing expression or pattern");
  }

  let kind: "simple" | "regex" | "relaxed" | undefined;
  if (kindNode) {
    const k = ctx.slice(kindNode);
    if (k.includes("simple")) kind = "simple";
    else if (k.includes("regex")) kind = "regex";
    else if (k.includes("relaxed")) kind = "relaxed";
  }

  const expression = ctx.mapScalarExpression(exprNode);
  const column = expression.type === "Identifier"
    ? expression.name
    : ctx.slice(exprNode);

  return {
    type: "ParseOperator",
    column,
    kind,
    pattern: ctx.parseStringLiteral(ctx.slice(patternNode)),
    start: node.from,
    end: node.to,
  };
}
