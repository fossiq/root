import {
  seq,
  ref,
  choice,
  type RuleDef,
  group,
  optional,
  separatedList,
  kw,
  many,
} from "@fossiq/lezer-grammar-generator";

/**
 * Scalar expression rules.
 * Includes arithmetic, comparison, and logical operators.
 */
export const expressionRules: Record<string, RuleDef> = {
  Expression: {
    expression: choice(ref("OrExpression"), ref("RangeExpression")),
  },

  OrExpression: {
    expression: choice(
      seq(ref("OrExpression"), kw("or"), ref("AndExpression")),
      ref("AndExpression")
    ),
  },

  AndExpression: {
    expression: choice(
      seq(ref("AndExpression"), kw("and"), ref("NotExpression")),
      ref("NotExpression")
    ),
  },

  NotExpression: {
    expression: choice(
      seq(kw("not"), ref("NotExpression")),
      ref("ComparisonExpression")
    ),
  },

  RangeExpression: {
    expression: seq(
      ref("AdditiveExpression"),
      ref("RangeOp"),
      ref("AdditiveExpression")
    ),
  },

  RangeOp: {
    expression: ref("RangeDoubleDot"),
  },

  ComparisonExpression: {
    expression: seq(
      ref("AdditiveExpression"),
      optional(seq(ref("GeneralComparisonOp"), ref("AdditiveExpression")))
    ),
  },

  GeneralComparisonOp: {
    expression: choice(ref("ComparisonOp"), ref("StringOp"), ref("BetweenOp")),
  },

  StringOp: {
    expression: choice(
      kw("contains"),
      ref("NotContains"),
      ref("ContainsCs"),
      ref("NotContainsCs"),
      kw("startswith"),
      ref("NotStartsWith"),
      ref("StartsWithCs"),
      ref("NotStartsWithCs"),
      kw("endswith"),
      ref("NotEndsWith"),
      ref("EndsWithCs"),
      ref("NotEndsWithCs"),
      kw("has"),
      ref("NotHas"),
      ref("HasCs"),
      ref("NotHasCs"),
      kw("hasprefix"),
      ref("NotHasPrefix"),
      kw("hassuffix"),
      ref("NotHasSuffix"),
      kw("in"),
      ref("NotIn"),
      ref("InCs"),
      ref("NotInCs"),
      seq(kw("matches"), kw("regex"))
    ),
  },

  BetweenOp: {
    expression: choice(kw("between"), ref("NotBetween")),
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
      ref("ArrayLiteral"),
      seq(ref("OpenParen"), ref("Expression"), ref("CloseParen")),
      ref("FunctionCall"),
      choice(
        ref("Identifier"),
        ref("BracketedIdentifier"),
        ref("Number"),
        ref("String"),
        kw("true"),
        kw("false"),
        kw("null")
      )
    ),
  },

  ArrayLiteral: {
    expression: choice(
      seq(
        ref("OpenParen"),
        ref("Expression"),
        ref("Comma"),
        ref("Expression"),
        many(seq(ref("Comma"), ref("Expression"))),
        ref("CloseParen")
      ),
      seq(ref("OpenParen"), ref("Expression"), ref("Comma"), ref("CloseParen")),
      seq(ref("OpenParen"), ref("CloseParen"))
    ),
  },

  FunctionCall: {
    expression: seq(
      ref("Identifier"),
      ref("OpenParen"),
      optional(ref("ArgumentList")),
      ref("CloseParen")
    ),
  },

  ArgumentList: {
    expression: separatedList(ref("Expression"), ref("Comma"), { min: 1 }),
  },
};
