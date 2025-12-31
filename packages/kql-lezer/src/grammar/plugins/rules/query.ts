import { seq, many, ref, choice, optional, type RuleDef, kw } from "@fossiq/lezer-grammar-generator";

/**
 * Top-level query rules.
 */
export const queryRules: Record<string, RuleDef> = {
    Query: {
        expression: seq(
            many(choice(ref("LetStatement"), ref("SetStatement"), ref("DeclareQueryParametersStatement"))),
            ref("QueryExpression")
        ),
    },

    QueryExpression: {
        expression: choice(
            ref("PipelineExpression"),
            ref("UnionExpression"),
            ref("SearchExpression"),
            ref("FindExpression")
        )
    },

    UnionExpression: {
        expression: seq(
            kw("union"),
            optional(ref("UnionParameters")),
            ref("TableList")
        )
    },

    SearchExpression: {
        expression: seq(
            kw("search"),
            many(choice(ref("Identifier"), ref("String"), ref("Pipe"), ref("OpenParen"), ref("CloseParen"), kw("in"), kw("kind"), ref("Equals")))
            // TODO: Improve search grammar
        )
    },

    FindExpression: {
        expression: seq(
            kw("find"),
            many(choice(ref("Identifier"), ref("String"), ref("Pipe"), ref("OpenParen"), ref("CloseParen"), kw("in"), kw("kind"), ref("Equals")))
            // TODO: Improve find grammar
        )
    }
};