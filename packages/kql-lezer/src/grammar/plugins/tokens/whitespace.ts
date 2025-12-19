import {
    literal,
    regex,
    seq,
    type TokenDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Whitespace and comment tokens for KQL grammar.
 */
export const whitespaceTokens: TokenDef[] = [
    // Comments: // followed by anything except newline
    { name: "LineComment", pattern: seq(literal("//"), regex(/[^\n]*/)) },

    // Whitespace: one or more space, tab, newline, or carriage return
    { name: "whitespace", pattern: regex(/[ \t\n\r]+/) },
];
