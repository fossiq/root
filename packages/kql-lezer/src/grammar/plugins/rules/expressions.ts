import {
    seq,
    many,
    ref,
    choice,
    literal,
    type RuleDef,
    group,
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
        expression: choice(
            seq(
                ref("AdditiveExpression"),
                group(choice(literal("+"), literal("-"))),
                ref("MultiplicativeExpression"),
            ),
            ref("MultiplicativeExpression"),
        ),
    },

    MultiplicativeExpression: {
        expression: choice(
            seq(
                ref("MultiplicativeExpression"),
                group(choice(literal("*"), literal("/"), literal("%"))),
                ref("PrimaryExpression"),
            ),
            ref("PrimaryExpression"),
        ),
    },

    PrimaryExpression: {
        expression: choice(
            seq(literal("("), ref("Expression"), literal(")")),
            choice(ref("Identifier"), ref("Number"), ref("String")),
        ),
    },
};
