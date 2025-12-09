import { parseKQL, extractHighlightTokens, toParsedAST } from "../src/index";
import type { ParseResult, HighlightToken } from "@fossiq/kql-ast";

/**
 * Parse KQL query and return result
 */
export function parse(query: string): ParseResult {
  return toParsedAST(query);
}

/**
 * Parse KQL and get highlight tokens
 */
export function getTokens(query: string): HighlightToken[] {
  return extractHighlightTokens(query);
}

/**
 * Parse KQL and get full result with tokens
 */
export function parseWithTokens(query: string): ParseResult {
  return parseKQL(query);
}

/**
 * Check if query parses without errors
 */
export function isValid(query: string): boolean {
  const result = parse(query);
  return result.errors.length === 0;
}

/**
 * Get error count
 */
export function getErrorCount(query: string): number {
  const result = parse(query);
  return result.errors.length;
}

/**
 * Get token count
 */
export function getTokenCount(query: string): number {
  const tokens = getTokens(query);
  return tokens.length;
}
