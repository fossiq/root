import {
  seq,
  ref,
  kw,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Plugin operator (evaluate).
 */
export const pluginOperatorRules: Record<string, RuleDef> = {
  EvaluateClause: {
    expression: seq(
      kw("evaluate"),
      ref("FunctionCall") // Reuse FunctionCall for plugin invocation
    ),
  },
};
