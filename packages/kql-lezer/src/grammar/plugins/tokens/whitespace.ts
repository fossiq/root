import {
  literal,
  regex,
  seq,
  type TokenDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Whitespace and comment tokens for KQL grammar.
 *
 * These tokens are typically skipped during parsing but are important for
 * preserving source location information and syntax highlighting.
 */
export const whitespaceTokens: TokenDef[] = [
  // Line comment: // followed by any characters except newline
  // Used for single-line documentation and notes
  {
    name: "LineComment",
    pattern: seq(literal("//"), regex(/[^\n]*/)),
  },

  // Whitespace: one or more space, tab, newline, or carriage return
  // These are typically skipped by the parser but preserved for formatting
  { name: "whitespace", pattern: regex(/[ \t\n\r]+/) },
];
