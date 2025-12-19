import {
    seq,
    many,
    ref,
    choice,
    literal,
    type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Scalar expression rules.
 * Includes arithmetic and comparison operators.
 */
export const expressionRules: Record<string, RuleDef> = {
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
