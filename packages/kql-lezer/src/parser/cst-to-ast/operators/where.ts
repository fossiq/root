import { SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "../context";
import type * as AST from "@fossiq/kql-ast";

/**
 * Map a WhereClause CST node to a WhereOperator AST node.
 *
 * Grammar structure:
 *   WhereClause: "where" Expression
 *
 * Example:
 *   where EventType == "Rain"
 *   where Magnitude > 5
 *   where age > 18 and status == "active"
 */
export function mapWhereOperator(
    node: SyntaxNode,
    ctx: CstToAstContext,
): AST.WhereOperator | AST.ErrorNode {
    // Find the "where" keyword and the expression
    const exprNode = ctx.getChild(node, "Expression");

    if (!exprNode) {
        return ctx.errorNode(node, "WhereClause missing expression");
    }

    const expression = ctx.mapScalarExpression(exprNode);

    return {
        type: "WhereOperator",
        expression,
        start: node.from,
        end: node.to,
    };
}
