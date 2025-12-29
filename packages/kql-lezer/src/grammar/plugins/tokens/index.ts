import type { TokenDef } from "@fossiq/lezer-grammar-generator";
import { delimiterTokens } from "./delimiters";
import { operatorTokens } from "./operators";
import { literalTokens } from "./literals";
import { keywordTokens } from "./keywords";
import { whitespaceTokens } from "./whitespace";

/**
 * All tokens for KQL grammar.
 * Organized by category for maintainability.
 */
const coreTokenNames = new Set([
  "Pipe",
  "OpenParen",
  "CloseParen",
  "Semicolon",
  "Equals",
  "Comma",
  "Plus",
  "Minus",
  "Star",
  "Slash",
  "Percent",
  "ComparisonOp",
  "Identifier",
  "Number",
  "String",
  "LineComment",
  "whitespace",
]);

export const allTokens: TokenDef[] = [
  ...delimiterTokens,
  ...operatorTokens,
  ...literalTokens,
  ...keywordTokens,
  ...whitespaceTokens,
].filter((token) => coreTokenNames.has(token.name));

// Re-export individual token groups for selective use
export {
  delimiterTokens,
  operatorTokens,
  literalTokens,
  keywordTokens,
  whitespaceTokens,
};
