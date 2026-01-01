import { SyntaxNode } from "@lezer/common";
import * as AST from "@fossiq/kql-ast";
import { mapScalarExpression } from "./expressions/scalar";
import { mapFunctionCall } from "./primitives";

/**
 * Utility functions for navigating syntax nodes.
 * Provides dependency injection for pure functions.
 */

export interface MapperContext {
  slice: (node: SyntaxNode) => string;
  getChild: (node: SyntaxNode, typeName: string) => SyntaxNode | null;
  getChildren: (node: SyntaxNode, typeName: string) => SyntaxNode[];
  parseStringLiteral: (raw: string) => string;
  mapScalarExpression: (node: SyntaxNode) => AST.Expression;
  mapFunctionCall: (node: SyntaxNode) => AST.FunctionCall | AST.ErrorNode;
  errorNode: (node: SyntaxNode, msg: string) => AST.ErrorNode;
}

/**
 * Create a context object with utility functions.
 */
export class CstToAstContext implements MapperContext {
  constructor(private text: string) {}

  slice = (node: SyntaxNode) => {
    return this.text.slice(node.from, node.to);
  };

  getChild = (node: SyntaxNode, typeName: string): SyntaxNode | null => {
    let child = node.firstChild;
    while (child) {
      if (child.type.name === typeName) {
        return child;
      }
      child = child.nextSibling;
    }
    return null;
  };

  getChildren = (node: SyntaxNode, typeName: string): SyntaxNode[] => {
    const children: SyntaxNode[] = [];
    let child = node.firstChild;
    while (child) {
      if (child.type.name === typeName) {
        children.push(child);
      }
      child = child.nextSibling;
    }
    return children;
  };

  parseStringLiteral = (raw: string): string => {
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
        .replace(/'/g, "'")
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");
    }

    return raw;
  };

  mapScalarExpression = (node: SyntaxNode): AST.Expression => {
    return mapScalarExpression(node, this);
  };

  mapFunctionCall = (node: SyntaxNode): AST.FunctionCall | AST.ErrorNode => {
    return mapFunctionCall(node, this);
  };

  errorNode = (node: SyntaxNode, msg: string): AST.ErrorNode => {
    return {
      type: "ErrorNode",
      error: msg,
      from: node.from,
      to: node.to,
    };
  };
}
