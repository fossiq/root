import { literal, choice, type TokenDef } from "@fossiq/lezer-grammar-generator";

/**
 * Operator tokens for KQL grammar.
 */
export const operatorTokens: TokenDef[] = [
    // Math operators
    { name: "Plus", pattern: literal("+") },
    { name: "Minus", pattern: literal("-") },
    { name: "Star", pattern: literal("*") },
    { name: "Slash", pattern: literal("/") },
    { name: "Percent", pattern: literal("%") },

    // Comparison operators - combined into one token with alternatives
    {
        name: "ComparisonOp",
        pattern: choice(
            literal("=="),
            literal("!="),
            literal(">="),
            literal("<="),
            literal(">"),
            literal("<")
        ),
    },
];
