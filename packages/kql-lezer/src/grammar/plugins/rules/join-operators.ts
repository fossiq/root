import {
  seq,
  ref,
  choice,
  separatedList,
  kw,
  optional,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Join and Lookup operator rules.
 */
export const joinOperatorRules: Record<string, RuleDef> = {
  JoinClause: {
    expression: seq(
      kw("join"),
      optional(ref("JoinParameters")),
      ref("TableExpression"),
      kw("on"),
      ref("JoinConditionList")
    ),
  },

  LookupClause: {
    expression: seq(
      kw("lookup"),
      optional(ref("JoinParameters")),
      ref("TableExpression"),
      kw("on"),
      ref("JoinConditionList")
    ),
  },

  JoinParameters: {
    expression: choice(
        seq(kw("kind"), ref("Equals"), ref("JoinKind")),
        // TODO: support multiple parameters
    ),
  },

  JoinKind: {
    expression: choice(
      kw("inner"),
      kw("innerunique"),
      kw("leftouter"),
      kw("rightouter"),
      kw("fullouter"),
      kw("leftanti"),
      kw("leftsemi"),
      kw("rightanti"),
      kw("rightsemi")
    ),
  },

  JoinConditionList: {
    expression: separatedList(ref("Expression"), ref("Comma"), { min: 1 }),
  },
};
