import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";

/**
 * Central context for CST-to-AST conversion.
 *
 * Provides utilities for navigating Lezer syntax nodes and mapping them
 * to typed AST nodes from @fossiq/kql-ast.
 */
export class CstToAstContext {
    constructor(private text: string) {}

    /**
     * Extract the text content of a syntax node.
     */
    slice(node: SyntaxNode): string {
        return this.text.slice(node.from, node.to);
    }

    /**
     * Create an error node for malformed or unexpected CST nodes.
     */
    errorNode(node: SyntaxNode, message: string): AST.ErrorNode {
        return {
            type: "ErrorNode",
            error: message,
            from: node.from,
            to: node.to,
        };
    }

    /**
     * Map a scalar expression node to an AST Expression.
     * Dispatches to appropriate handlers based on node type.
     */
    mapScalarExpression(node: SyntaxNode): AST.Expression {
        switch (node.type.name) {
            case "AdditiveExpression":
                return this.mapAdditiveExpression(node);
            case "MultiplicativeExpression":
                return this.mapMultiplicativeExpression(node);
            case "PrimaryExpression":
                return this.mapPrimaryExpression(node);
            case "Expression":
                if (node.firstChild) {
                    return this.mapScalarExpression(node.firstChild);
                }
                return this.errorNode(node, "Empty expression");
            default:
                return this.errorNode(
                    node,
                    `Unsupported expression type: ${node.type.name}`,
                );
        }
    }

    /**
     * Map an additive expression (+ or -).
     */
    private mapAdditiveExpression(node: SyntaxNode): AST.Expression {
        const children = this.collectChildren(node);

        // If there's only one child, it's just a multiplicative expression
        if (children.length === 1) {
            return this.mapScalarExpression(children[0]);
        }

        // Build left-associative binary expression tree
        let left = this.mapScalarExpression(children[0]);
        let i = 1;

        while (i < children.length) {
            const opNode = children[i];
            const op = this.slice(opNode);
            const right = this.mapScalarExpression(children[i + 1]);

            left = {
                type: "BinaryExpression",
                operator: op as "+" | "-",
                left,
                right,
                start: node.from,
                end: node.to,
            };

            i += 2;
        }

        return left;
    }

    /**
     * Map a multiplicative expression (*, /, %).
     */
    private mapMultiplicativeExpression(node: SyntaxNode): AST.Expression {
        const children = this.collectChildren(node);

        // If there's only one child, it's just a primary expression
        if (children.length === 1) {
            return this.mapScalarExpression(children[0]);
        }

        // Build left-associative binary expression tree
        let left = this.mapScalarExpression(children[0]);
        let i = 1;

        while (i < children.length) {
            const opNode = children[i];
            const op = this.slice(opNode);
            const right = this.mapScalarExpression(children[i + 1]);

            left = {
                type: "BinaryExpression",
                operator: op as "*" | "/" | "%",
                left,
                right,
                start: node.from,
                end: node.to,
            };

            i += 2;
        }

        return left;
    }

    /**
     * Map a primary expression (literal, identifier, or parenthesized).
     */
    private mapPrimaryExpression(node: SyntaxNode): AST.Expression {
        const child = node.firstChild;
        if (!child) {
            return this.errorNode(node, "Empty primary expression");
        }

        switch (child.type.name) {
            case "Number":
                return {
                    type: "NumberLiteral",
                    value: parseFloat(this.slice(child)),
                    raw: this.slice(child),
                    start: child.from,
                    end: child.to,
                };

            case "String":
                return {
                    type: "StringLiteral",
                    value: this.parseStringLiteral(this.slice(child)),
                    raw: this.slice(child),
                    start: child.from,
                    end: child.to,
                };

            case "Identifier":
                return {
                    type: "Identifier",
                    name: this.slice(child),
                    start: child.from,
                    end: child.to,
                };

            case "OpenParen":
                // Parenthesized expression: skip open paren, map inner expression
                const innerExpr = child.nextSibling;
                if (innerExpr) {
                    return this.mapScalarExpression(innerExpr);
                }
                return this.errorNode(node, "Empty parenthesized expression");

            default:
                return this.errorNode(
                    child,
                    `Unsupported primary expression: ${child.type.name}`,
                );
        }
    }

    /**
     * Parse a KQL string literal, removing quotes and handling escape sequences.
     */
    private parseStringLiteral(raw: string): string {
        // Handle verbatim strings @"..." or @'...'
        if (raw.startsWith('@"') && raw.endsWith('"')) {
            return raw.slice(2, -1);
        }
        if (raw.startsWith("@'") && raw.endsWith("'")) {
            return raw.slice(2, -1);
        }

        // Handle obfuscated strings h"..." or h@"..."
        if (raw.startsWith('h@"') && raw.endsWith('"')) {
            return raw.slice(3, -1);
        }
        if (raw.startsWith('h"') && raw.endsWith('"')) {
            return raw.slice(2, -1);
        }

        // Handle regular strings "..." or '...'
        if (
            (raw.startsWith('"') && raw.endsWith('"')) ||
            (raw.startsWith("'") && raw.endsWith("'"))
        ) {
            // Simple unescape (handle \", \', \\, \n, \t, \r)
            return raw
                .slice(1, -1)
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, "\\")
                .replace(/\\n/g, "\n")
                .replace(/\\t/g, "\t")
                .replace(/\\r/g, "\r");
        }

        return raw;
    }

    /**
     * Collect all direct children of a node as an array.
     */
    private collectChildren(node: SyntaxNode): SyntaxNode[] {
        const children: SyntaxNode[] = [];
        let child = node.firstChild;
        while (child) {
            children.push(child);
            child = child.nextSibling;
        }
        return children;
    }

    /**
     * Find a child node by type name.
     */
    getChild(node: SyntaxNode, typeName: string): SyntaxNode | null {
        let child = node.firstChild;
        while (child) {
            if (child.type.name === typeName) {
                return child;
            }
            child = child.nextSibling;
        }
        return null;
    }

    /**
     * Find all children of a given type.
     */
    getChildren(node: SyntaxNode, typeName: string): SyntaxNode[] {
        const children: SyntaxNode[] = [];
        let child = node.firstChild;
        while (child) {
            if (child.type.name === typeName) {
                children.push(child);
            }
            child = child.nextSibling;
        }
        return children;
    }
}
