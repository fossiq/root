import {
  seq,
  ref,
  choice,
  separatedList,
  kw,
  optional,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Data manipulation operators (parse, datatable, print, make-series, serialize).
 */
export const dataOperatorRules: Record<string, RuleDef> = {
  ParseClause: {
    expression: seq(
      kw("parse"),
      optional(ref("ParseKind")),
      ref("Expression"), // The source column/expression
      kw("with"),
      ref("String") // The pattern
    ),
  },

  ParseKind: {
    expression: choice(
        seq(kw("kind"), ref("Equals"), kw("simple")),
        seq(kw("kind"), ref("Equals"), kw("regex")),
        seq(kw("kind"), ref("Equals"), kw("relaxed"))
    )
  },

  DatatableClause: {
    expression: seq(
      kw("datatable"),
      ref("OpenParen"),
      ref("DatatableSchema"),
      ref("CloseParen"),
      ref("OpenBracket"),
      ref("DatatableData"),
      ref("CloseBracket")
    ),
  },

  DatatableSchema: {
      expression: separatedList(ref("DatatableColumnDef"), ref("Comma"), { min: 1 })
  },

  DatatableColumnDef: {
      expression: seq(ref("Identifier"), ref("Colon"), ref("Identifier")) // Col:Type
  },

  DatatableData: {
      expression: separatedList(ref("LiteralValue"), ref("Comma"), { min: 0 })
  },
  
  LiteralValue: {
      expression: choice(ref("Number"), ref("String"), kw("true"), kw("false"), kw("null"))
  },

  PrintClause: {
    expression: seq(
      kw("print"),
      ref("ProjectExpressionList")
    ),
  },

  MakeSeriesClause: {
    expression: seq(
      ref("MakeSeries"),
      ref("AggregationList"),
      kw("on"),
      ref("Expression"), // Axis column (usually timestamp)
      optional(seq(kw("step"), ref("Expression"))), // Time step
      optional(seq(kw("by"), ref("GroupByList")))
    ),
  },

  SerializeClause: {
    expression: seq(
      kw("serialize"),
      optional(ref("IdentifierList"))
    ),
  },
};
