import {
  seq,
  ref,
  kw,
  optional,
  choice,
  separatedList,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Statement rules (set, declare query_parameters).
 */
export const statementRules: Record<string, RuleDef> = {
  SetStatement: {
    expression: seq(
      kw("set"),
      ref("Identifier"), // Option name
      optional(seq(ref("Equals"), choice(ref("String"), ref("Number"), ref("Identifier"), kw("true"), kw("false")))),
      ref("Semicolon")
    ),
  },

  DeclareQueryParametersStatement: {
      expression: seq(
          kw("declare"),
          kw("query_parameters"),
          ref("OpenParen"),
          ref("QueryParameterList"),
          ref("CloseParen"),
          ref("Semicolon")
      )
  },

  QueryParameterList: {
      expression: separatedList(ref("QueryParameter"), ref("Comma"), { min: 1 })
  },

  QueryParameter: {
      expression: seq(
          ref("Identifier"), // Name
          ref("Colon"),
          ref("Identifier"), // Type
          optional(seq(ref("Equals"), ref("Expression"))) // Default value
      )
  }
};
