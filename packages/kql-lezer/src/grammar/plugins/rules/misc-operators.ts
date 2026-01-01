import {
  seq,
  ref,
  kw,
  optional,
  choice,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Miscellaneous operators (partition, sample, getschema, render).
 */
export const miscOperatorRules: Record<string, RuleDef> = {
  AsClause: {
    expression: seq(kw("as"), optional(ref("AsHint")), ref("Identifier")),
  },

  AsHint: {
    expression: seq(
      kw("hint"),
      ref("Dot"),
      kw("materialized"),
      ref("Equals"),
      choice(kw("true"), kw("false"))
    ),
  },

  PartitionClause: {
    expression: seq(
      kw("partition"),
      kw("by"),
      ref("Identifier"), // Column
      ref("OpenParen"), // Sub-query scope
      ref("PipelineExpression"), // Reusing pipeline for sub-query
      ref("CloseParen")
    ),
  },

  SampleClause: {
    expression: seq(
      kw("sample"),
      ref("Expression") // Count or Expression
    ),
  },

  GetSchemaClause: {
    expression: kw("getschema"),
  },

  RenderClause: {
    expression: seq(
      kw("render"),
      ref("Identifier") // Chart type (barchart, timechart, etc.)
    ),
  },
};
