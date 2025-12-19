import { Tree, SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "./context";
import { mapWhereOperator } from "./operators/where";
import type * as AST from "@fossiq/kql-ast";

/**
 * Convert a Lezer parse tree (CST) to a KQL AST.
 *
 * This is the main entry point for CST-to-AST conversion.
 * It walks the Lezer syntax tree and dispatches to appropriate
 * mappers based on node types.
 */
export function cstToAst(tree: Tree, text: string): AST.Query | AST.ErrorNode {
    const ctx = new CstToAstContext(text);
    const topNode = tree.topNode;

    // The top node should be "Query"
    if (topNode.type.name !== "Query") {
        return ctx.errorNode(
            topNode,
            `Expected Query node, got ${topNode.type.name}`,
        );
    }

    return mapQuery(topNode, ctx);
}

/**
 * Map the top-level Query node.
 *
 * Grammar structure:
 *   Query: LetStatement* PipelineExpression
 */
function mapQuery(
    node: SyntaxNode,
    ctx: CstToAstContext,
): AST.Query | AST.ErrorNode {
    const letStatements: AST.LetStatement[] = [];
    const letNodes = ctx.getChildren(node, "LetStatement");

    for (const letNode of letNodes) {
        const letStmt = mapLetStatement(letNode, ctx);
        if (letStmt.type === "ErrorNode") {
            return letStmt;
        }
        letStatements.push(letStmt);
    }

    // Get the pipeline expression
    const pipelineNode = ctx.getChild(node, "PipelineExpression");
    if (!pipelineNode) {
        return ctx.errorNode(node, "Query missing PipelineExpression");
    }

    const pipeline = mapPipelineExpression(pipelineNode, ctx);
    if (pipeline.type === "ErrorNode") {
        return pipeline;
    }

    return {
        type: "Query",
        letStatements,
        pipeline,
        start: node.from,
        end: node.to,
    };
}

/**
 * Map a LetStatement node.
 *
 * Grammar structure:
 *   LetStatement: "let" Identifier "=" Expression ";"
 */
function mapLetStatement(
    node: SyntaxNode,
    ctx: CstToAstContext,
): AST.LetStatement | AST.ErrorNode {
    const identifierNode = ctx.getChild(node, "Identifier");
    if (!identifierNode) {
        return ctx.errorNode(node, "LetStatement missing identifier");
    }

    const exprNode = ctx.getChild(node, "Expression");
    if (!exprNode) {
        return ctx.errorNode(node, "LetStatement missing expression");
    }

    const name = ctx.slice(identifierNode);
    const value = ctx.mapScalarExpression(exprNode);

    return {
        type: "LetStatement",
        name,
        value,
        start: node.from,
        end: node.to,
    };
}

/**
 * Map a PipelineExpression node.
 *
 * Grammar structure:
 *   PipelineExpression: TableExpression ("|" WhereClause)*
 */
function mapPipelineExpression(
    node: SyntaxNode,
    ctx: CstToAstContext,
): AST.PipelineExpression | AST.ErrorNode {
    const tableNode = ctx.getChild(node, "TableExpression");
    if (!tableNode) {
        return ctx.errorNode(
            node,
            "PipelineExpression missing TableExpression",
        );
    }

    const source = mapTableExpression(tableNode, ctx);
    if (source.type === "ErrorNode") {
        return source;
    }

    // Collect all tabular operators (currently only WhereClause)
    const operators: AST.TabularOperator[] = [];
    const whereNodes = ctx.getChildren(node, "WhereClause");

    for (const whereNode of whereNodes) {
        const whereOp = mapWhereOperator(whereNode, ctx);
        if (whereOp.type === "ErrorNode") {
            return whereOp;
        }
        operators.push(whereOp);
    }

    return {
        type: "PipelineExpression",
        source,
        operators,
        start: node.from,
        end: node.to,
    };
}

/**
 * Map a TableExpression node.
 *
 * Grammar structure:
 *   TableExpression: Identifier | "(" PipelineExpression ")"
 */
function mapTableExpression(
    node: SyntaxNode,
    ctx: CstToAstContext,
): AST.TableReference | AST.PipelineExpression | AST.ErrorNode {
    const child = node.firstChild;
    if (!child) {
        return ctx.errorNode(node, "Empty TableExpression");
    }

    if (child.type.name === "Identifier") {
        return {
            type: "TableReference",
            name: ctx.slice(child),
            start: child.from,
            end: child.to,
        };
    }

    if (child.type.name === "OpenParen") {
        // Parenthesized pipeline expression
        const innerPipeline = child.nextSibling;
        if (innerPipeline && innerPipeline.type.name === "PipelineExpression") {
            return mapPipelineExpression(innerPipeline, ctx);
        }
        return ctx.errorNode(node, "Invalid parenthesized table expression");
    }

    return ctx.errorNode(
        child,
        `Unsupported table expression: ${child.type.name}`,
    );
}

/**
 * Export the context class for use in custom mappers.
 */
export { CstToAstContext };
