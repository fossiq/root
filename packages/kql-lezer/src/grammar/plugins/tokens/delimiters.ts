import { literal, type TokenDef } from "@fossiq/lezer-grammar-generator";

/**
 * Delimiter tokens for KQL grammar.
 */
export const delimiterTokens: TokenDef[] = [
    { name: "Pipe", pattern: literal("|") },
    { name: "OpenParen", pattern: literal("(") },
    { name: "CloseParen", pattern: literal(")") },
    { name: "OpenBracket", pattern: literal("[") },
    { name: "CloseBracket", pattern: literal("]") },
    { name: "Comma", pattern: literal(",") },
    { name: "Semicolon", pattern: literal(";") },
    { name: "Equals", pattern: literal("=") },
];
