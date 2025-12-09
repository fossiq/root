import type { ParseResult, HighlightToken } from "@fossiq/kql-ast";

/**
 * Placeholder exports for kql-lezer
 *
 * Parser generated from grammar in kql.grammar
 * Full CodeMirror integration pending resolution of dependency version conflicts
 */

/**
 * Convert Lezer parse tree to @fossiq/kql-ast ParseResult
 *
 * This allows the Lezer parser output to be compatible with
 * other KQL tools expecting the shared AST format.
 */
export function toParsedAST(doc: string): ParseResult {
  return {
    errors: [],
    // TODO: Implement full AST conversion from Lezer tree to kql-ast types
    // This would traverse the Lezer parse tree and build compatible AST nodes
  };
}

/**
 * Extract highlight tokens from Lezer parse tree
 */
export function extractHighlightTokens(doc: string): HighlightToken[] {
  // TODO: Implement token extraction from Lezer parse tree
  return [];
}

/**
 * Initialize KQL language for CodeMirror
 *
 * TODO: Implement once dependency versions are aligned
 */
export function kql() {
  // Placeholder for CodeMirror language support
  return null;
}
