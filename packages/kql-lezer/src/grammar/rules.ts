import {
    seq,
    choice,
    ref,
    many,
    kw,
    literal,
    type GrammarDefinition,
} from "@fossiq/lezer-grammar-generator";

/**
 * Core KQL grammar rules.
 * Includes let statements, pipeline chaining with where,
 * and basic scalar expression operators.
 */
export const rules: GrammarDefinition["rules"] = {
    Query: {
        expression: seq(many(ref("LetStatement")), ref("PipelineExpression")),
    },

    LetStatement: {
        expression: seq(
            kw("let"),
            ref("Identifier"),
            literal("="),
            ref("Expression"),
            literal(";"),
        ),
    },

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

    WhereClause: {
        expression: seq(kw("where"), ref("Expression")),
    },

    Expression: {
        expression: ref("AdditiveExpression"),
    },

    AdditiveExpression: {
        expression: seq(
            ref("MultiplicativeExpression"),
            many(
                seq(
                    choice(literal("+"), literal("-")),
                    ref("MultiplicativeExpression"),
                ),
            ),
        ),
    },

    MultiplicativeExpression: {
        expression: seq(
            ref("PrimaryExpression"),
            many(
                seq(
                    choice(literal("*"), literal("/"), literal("%")),
                    ref("PrimaryExpression"),
                ),
            ),
        ),
    },

    PrimaryExpression: {
        expression: choice(
            seq(literal("("), ref("Expression"), literal(")")),
            choice(ref("Identifier"), ref("Number"), ref("String")),
        ),
    },
};
