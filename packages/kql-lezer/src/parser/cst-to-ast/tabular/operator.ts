import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";
import { mapParseOperator } from "../operators/data/parse";
import { mapDatatableOperator } from "../operators/data/datatable";
import { mapPrintOperator } from "../operators/data/print";
import { mapMakeSeriesOperator } from "../operators/data/make-series";
import { mapJoinOperator, mapLookupOperator } from "../operators/join";
import { mapWhereOperator } from "../operators/where";
import { mapAsOperator } from "../operators/misc/as";
import { mapEvaluateOperator } from "../operators/misc/evaluate";
import { mapGetSchemaOperator } from "../operators/misc/schema";
import { mapPartitionOperator } from "../operators/misc/partition";
import { mapRenderOperator } from "../operators/misc/render";
import { mapSampleOperator } from "../operators/misc/sample";
import { mapSerializeOperator } from "../operators/misc/serialize";
import {
  mapExtendClause,
  mapProjectClause,
  mapProjectRenameClause,
  mapProjectVariant,
} from "./project";
import { mapSortClause, mapLimitClause, mapTopClause } from "./sort";
import {
  mapDistinctClause,
  mapMvExpandClause,
  mapSummarizeClause,
} from "./aggregate";
import { mapUnionClause } from "./union";
import { mapTableExpression } from "../query-expressions";

export function mapTabularOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const child = node.firstChild;
  if (!child) return ctx.errorNode(node, "Empty TabularOperator");

  switch (child.type.name) {
    case "WhereClause":
      return mapWhereOperator(child, ctx);
    case "ProjectClause":
      return mapProjectClause(child, ctx);
    case "ProjectAwayClause":
    case "ProjectKeepClause":
    case "ProjectReorderClause":
      return mapProjectVariant(child, ctx);
    case "ProjectRenameClause":
      return mapProjectRenameClause(child, ctx);
    case "ExtendClause":
      return mapExtendClause(child, ctx);
    case "SortClause":
      return mapSortClause(child, ctx);
    case "LimitClause":
    case "TakeClause":
      return mapLimitClause(child, ctx);
    case "TopClause":
      return mapTopClause(child, ctx);
    case "DistinctClause":
      return mapDistinctClause(child, ctx);
    case "SummarizeClause":
      return mapSummarizeClause(child, ctx);
    case "MvExpandClause":
      return mapMvExpandClause(child, ctx);
    case "UnionClause":
      return mapUnionClause(child, ctx);
    case "JoinClause":
      return mapJoinOperator(child, ctx);
    case "LookupClause":
      return mapLookupOperator(child, ctx);
    case "ParseClause":
      return mapParseOperator(child, ctx);
    case "DatatableClause":
      return mapDatatableOperator(child, ctx);
    case "PrintClause":
      return mapPrintOperator(child, ctx);
    case "MakeSeriesClause":
      return mapMakeSeriesOperator(child, ctx);
    case "SerializeClause":
      return mapSerializeOperator(child, ctx);
    case "AsClause":
      return mapAsOperator(child, ctx);
    case "PartitionClause":
      return mapPartitionOperator(child, ctx);
    case "SampleClause":
      return mapSampleOperator(child, ctx);
    case "GetSchemaClause":
      return mapGetSchemaOperator(child, ctx);
    case "RenderClause":
      return mapRenderOperator(child, ctx);
    case "EvaluateClause":
      return mapEvaluateOperator(child, ctx);
    case "TableExpression":
      return mapTableExpression(child, ctx) as unknown as AST.TabularOperator;
    case "Number":
    case "String":
      return {
        type: "ProjectOperator",
        columns: [
          {
            type: "ProjectColumn",
            expression: ctx.mapScalarExpression(child),
          },
        ],
        start: child.from,
        end: child.to,
      } as AST.TabularOperator;
    default:
      return ctx.errorNode(
        child,
        `Unsupported tabular operator: ${child.type.name}`
      );
  }
}
