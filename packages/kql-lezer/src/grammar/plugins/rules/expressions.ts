import {
  seq,
  ref,
  choice,
  type RuleDef,
  group,
  optional,
} from "@fossiq/lezer-grammar-generator";

/**
 * Scalar expression rules.
 * Includes arithmetic and comparison operators.
 */
export const expressionRules: Record<string, RuleDef> = {
  Expression: {
    expression: ref("ComparisonExpression"),
  },

  ComparisonExpression: {
    expression: seq(
      ref("AdditiveExpression"),
      optional(seq(ref("ComparisonOp"), ref("AdditiveExpression")))
    ),
  },

  AdditiveExpression: {
    expression: choice(
      seq(
        ref("AdditiveExpression"),
        group(choice(ref("Plus"), ref("Minus"))),
        ref("MultiplicativeExpression")
      ),
      ref("MultiplicativeExpression")
    ),
  },

  MultiplicativeExpression: {
    expression: choice(
      seq(
        ref("MultiplicativeExpression"),
        group(choice(ref("Star"), ref("Slash"), ref("Percent"))),
        ref("PrimaryExpression")
      ),
      ref("PrimaryExpression")
    ),
  },

  PrimaryExpression: {
    expression: choice(
      seq(ref("OpenParen"), ref("Expression"), ref("CloseParen")),
      choice(ref("Identifier"), ref("Number"), ref("String"))
    ),
  },
};
