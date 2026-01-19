import type { ASTNode, TokenType } from "./base";
import type { Query } from "./query";

export interface ParserOptions {
  includeTrivia?: boolean;
  trackPositions?: boolean;
}

export interface HighlightToken {
  type: TokenType;
  start: number;
  end: number;
  value: string;
}

export interface ParseError extends ASTNode {
  type: "ParseError";
  message: string;
  expected?: string[];
}

export interface ParseResult {
  ast?: Query;
  tokens?: HighlightToken[];
  errors: ParseError[];
}
