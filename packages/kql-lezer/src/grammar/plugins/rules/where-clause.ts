import { seq, kw, ref, type RuleDef } from "@fossiq/lezer-grammar-generator";

/**
 * Where clause rule for filtering.
 */
export const whereClauseRules: Record<string, RuleDef> = {
    WhereClause: {
        expression: seq(kw("where"), ref("Expression")),
    },
};
