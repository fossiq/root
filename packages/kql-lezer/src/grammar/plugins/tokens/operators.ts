import { literal, choice, type TokenDef } from "@fossiq/lezer-grammar-generator";

/**
 * Operator tokens for KQL grammar.
 *
 * Arithmetic, comparison, and logical operators for expressions.
 */
export const operatorTokens: TokenDef[] = [
  // Arithmetic/Math operators: used in numeric expressions
  { name: "Plus", pattern: literal("+") },
  { name: "Minus", pattern: literal("-") },
  { name: "Star", pattern: literal("*") },
  { name: "Slash", pattern: literal("/") },
  { name: "Percent", pattern: literal("%") },

  // Comparison operators - combined into one token with alternatives
  // Matches: ==, !=, >=, <=, >, <
  {
    name: "ComparisonOp",
    pattern: choice(
      literal("=="),
      literal("!="),
      literal(">="),
      literal("<="),
      literal(">"),
      literal("<"),
    ),
  },
];
