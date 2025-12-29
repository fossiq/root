import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";

/**
 * Utility functions for CST-to-AST conversion.
 */

/**
 * Create an error node.
 */
export function createErrorNode(node: SyntaxNode, message: string): AST.ErrorNode {
  return {
    type: "ErrorNode",
    error: message,
    from: node.from,
    to: node.to,
  };
}

/**
 * Parse a KQL string literal.
 */
export function parseStringLiteral(raw: string): string {
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
      .replace(/\'/g, "'")
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r");
  }

  return raw;
}

/**
 * Collect all direct children of a node.
 */
export function collectChildren(node: SyntaxNode): SyntaxNode[] {
  const children: SyntaxNode[] = [];
  let child = node.firstChild;
  while (child) {
    children.push(child);
    child = child.nextSibling;
  }
  return children;
}