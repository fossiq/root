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
export const allTokens: TokenDef[] = [
    ...delimiterTokens,
    ...operatorTokens,
    ...literalTokens,
    ...keywordTokens,
    ...whitespaceTokens,
];

// Re-export individual token groups for selective use
export {
    delimiterTokens,
    operatorTokens,
    literalTokens,
    keywordTokens,
    whitespaceTokens,
};
