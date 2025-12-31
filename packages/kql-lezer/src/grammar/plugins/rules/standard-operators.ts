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
 * Standard tabular operators (sort, summarize, extend, limit, etc.).
 */
export const standardOperatorRules: Record<string, RuleDef> = {
  ExtendClause: {
      expression: seq(kw("extend"), ref("ProjectExpressionList"))
  },

  LimitClause: {
      expression: seq(kw("limit"), ref("Expression"))
  },

  TakeClause: {
      expression: seq(kw("take"), ref("Expression"))
  },

  SortClause: {
      expression: seq(
          choice(kw("sort"), kw("order")),
          optional(kw("by")),
          ref("SortExpressionList")
      )
  },

  SortExpressionList: {
      expression: separatedList(ref("SortExpressionItem"), ref("Comma"), { min: 1 })
  },

  SortExpressionItem: {
      expression: seq(
          ref("Expression"),
          optional(choice(kw("asc"), kw("desc"))),
          optional(seq(kw("nulls"), choice(kw("first"), kw("last"))))
      )
  },

  TopClause: {
      expression: seq(
          kw("top"),
          ref("Expression"),
          kw("by"),
          ref("SortExpressionList")
      )
  },

  DistinctClause: {
      expression: seq(
          kw("distinct"),
          ref("ProjectExpressionList") // distinct supports expressions
      )
  },

  SummarizeClause: {
      expression: seq(
          kw("summarize"),
          ref("AggregationList"),
          optional(seq(kw("by"), ref("GroupByList")))
      )
  },

  AggregationList: {
      expression: separatedList(ref("AggregationItem"), ref("Comma"), { min: 1 })
  },

  AggregationItem: {
      expression: choice(
          seq(ref("Identifier"), ref("Equals"), ref("FunctionCall")),
          ref("FunctionCall")
      )
  },

  GroupByList: {
      expression: separatedList(ref("Expression"), ref("Comma"), { min: 1 })
  },

  MvExpandClause: {
      expression: seq(
          ref("MvExpand"), // Token from keywords.ts
          ref("IdentifierList")
          // TODO: Support complex mv-expand syntax
      )
  },

  UnionClause: {
      expression: seq(
          kw("union"),
          optional(ref("UnionParameters")),
          ref("TableList")
      )
  },

  UnionParameters: {
       expression: choice(
           seq(kw("kind"), ref("Equals"), choice(kw("inner"), kw("outer"))),
           seq(kw("withsource"), ref("Equals"), ref("Identifier"))
       )
  },
  
  TableList: {
      expression: separatedList(ref("TableExpression"), ref("Comma"), { min: 1 })
  }
};
