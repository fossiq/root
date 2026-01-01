import { literal, type TokenDef } from "@fossiq/lezer-grammar-generator";

/**
 * Delimiter tokens for KQL grammar.
 *
 * Parentheses, brackets, and punctuation marks that structure KQL expressions.
 */
export const delimiterTokens: TokenDef[] = [
  // Pipe: separates query operations (e.g., source | where | project)
  { name: "Pipe", pattern: literal("|") },
  // Parentheses: for grouping expressions and function calls
  { name: "OpenParen", pattern: literal("(") },
  { name: "CloseParen", pattern: literal(")") },
  // Brackets: for array/collection syntax and table subscripting
  { name: "OpenBracket", pattern: literal("[") },
  { name: "CloseBracket", pattern: literal("]") },
  // Punctuation: separators and operators
  { name: "Comma", pattern: literal(",") },
  { name: "Semicolon", pattern: literal(";") },
  { name: "Equals", pattern: literal("=") },
  { name: "Colon", pattern: literal(":") },
  { name: "Dot", pattern: literal(".") },
];
