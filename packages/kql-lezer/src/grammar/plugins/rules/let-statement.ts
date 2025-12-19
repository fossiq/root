import { seq, kw, ref, literal, type RuleDef } from "@fossiq/lezer-grammar-generator";

/**
 * Let statement rule for variable binding.
 */
export const letStatementRules: Record<string, RuleDef> = {
    LetStatement: {
        expression: seq(
            kw("let"),
            ref("Identifier"),
            literal("="),
            ref("Expression"),
            literal(";"),
        ),
    },
};
