import {
  seq,
  many,
  ref,
  choice,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Pipeline and table expression rules.
 */
export const pipelineRules: Record<string, RuleDef> = {
  PipelineExpression: {
    expression: seq(
      ref("TableExpression"),
      many(seq(ref("Pipe"), ref("TabularOperator")))
    ),
  },

  TableExpression: {
    expression: choice(
      ref("Identifier"),
      seq(ref("OpenParen"), ref("PipelineExpression"), ref("CloseParen"))
    ),
  },
};
