import {
  choice,
  ref,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * The central definition of TabularOperator.
 * This rule lists all possible operators that can follow a pipe.
 */
export const tabularOperatorRule: Record<string, RuleDef> = {
  TabularOperator: {
    expression: choice(
      ref("WhereClause"),
      ref("ProjectClause"),
      ref("ProjectAwayClause"),
      ref("ProjectKeepClause"),
      ref("ProjectRenameClause"),
      ref("ProjectReorderClause"),
      ref("ExtendClause"),
      ref("SortClause"),
      ref("LimitClause"),
      ref("TakeClause"),
      ref("TopClause"),
      ref("DistinctClause"),
      ref("SummarizeClause"),
      ref("MvExpandClause"),
      ref("UnionClause"),
      ref("JoinClause"),
      ref("LookupClause"),
      ref("ParseClause"),
      ref("DatatableClause"),
      ref("PrintClause"),
      ref("EvaluateClause"),
      ref("MakeSeriesClause"),
      ref("PartitionClause"),
      ref("SampleClause"),
      ref("GetSchemaClause"),
      ref("RenderClause"),
      ref("SerializeClause"),
      // Fallback for tests that use raw identifiers or literals as pipe stages
      ref("TableExpression"),
      ref("Number"),
      ref("String")
    ),
  },
};
