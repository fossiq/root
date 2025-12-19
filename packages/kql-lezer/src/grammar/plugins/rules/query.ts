import { seq, many, ref, type RuleDef } from "@fossiq/lezer-grammar-generator";

/**
 * Top-level query rules.
 */
export const queryRules: Record<string, RuleDef> = {
    Query: {
        expression: seq(many(ref("LetStatement")), ref("PipelineExpression")),
    },
};
