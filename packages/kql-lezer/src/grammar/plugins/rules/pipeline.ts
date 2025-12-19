import { seq, many, ref, choice, literal, type RuleDef } from "@fossiq/lezer-grammar-generator";

/**
 * Pipeline and table expression rules.
 */
export const pipelineRules: Record<string, RuleDef> = {
    PipelineExpression: {
        expression: seq(
            ref("TableExpression"),
            many(seq(literal("|"), ref("WhereClause"))),
        ),
    },

    TableExpression: {
        expression: choice(
            ref("Identifier"),
            seq(literal("("), ref("PipelineExpression"), literal(")")),
        ),
    },
};
