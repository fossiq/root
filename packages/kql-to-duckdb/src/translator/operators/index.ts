import type {
  TabularOperator,
  WhereOperator,
  ProjectOperator,
  ProjectColumn,
  ProjectAwayOperator,
  ProjectKeepOperator,
  ProjectRenameOperator,
  ProjectReorderOperator,
  ExtendOperator,
  SortOperator,
  SortExpression,
  LimitOperator,
  TakeOperator,
  TopOperator,
  DistinctOperator,
  SummarizeOperator,
  Aggregation,
  JoinOperator,
  UnionOperator,
  MvExpandOperator,
  PipelineExpression,
  TableSource,
  FunctionCall,
} from "@fossiq/kql-ast";
import { translateExpression } from "../expressions";

export function translateOperator(
  operator: TabularOperator,
  inputRelation: string
): string {
  switch (operator.type) {
    case "WhereOperator":
      return translateWhere(operator as WhereOperator, inputRelation);
    case "ProjectOperator":
      return translateProject(operator as ProjectOperator, inputRelation);
    case "ProjectAwayOperator":
      return translateProjectAway(
        operator as ProjectAwayOperator,
        inputRelation
      );
    case "ProjectKeepOperator":
      return translateProjectKeep(
        operator as ProjectKeepOperator,
        inputRelation
      );
    case "ProjectRenameOperator":
      return translateProjectRename(
        operator as ProjectRenameOperator,
        inputRelation
      );
    case "ProjectReorderOperator":
      return translateProjectReorder(
        operator as ProjectReorderOperator,
        inputRelation
      );
    case "ExtendOperator":
      return translateExtend(operator as ExtendOperator, inputRelation);
    case "SortOperator":
      return translateSort(operator as SortOperator, inputRelation);
    case "LimitOperator":
      return translateLimit(operator as LimitOperator, inputRelation);
    case "TakeOperator":
      return translateTake(operator as TakeOperator, inputRelation);
    case "TopOperator":
      return translateTop(operator as TopOperator, inputRelation);
    case "DistinctOperator":
      return translateDistinct(operator as DistinctOperator, inputRelation);
    case "SummarizeOperator":
      return translateSummarize(operator as SummarizeOperator, inputRelation);
    case "JoinOperator":
      return translateJoin(operator as JoinOperator, inputRelation);
    case "UnionOperator":
      return translateUnion(operator as UnionOperator, inputRelation);
    case "MvExpandOperator":
      return translateMvExpand(operator as MvExpandOperator, inputRelation);
    default:
      throw new Error(
        `Unsupported operator: ${
          (operator as TabularOperator & { type: string }).type
        }`
      );
  }
}

// Import needed for translateUnion recursive call
let translatePipelineRef: (pipeline: PipelineExpression) => string;

export function setTranslatePipelineRef(
  fn: (pipeline: PipelineExpression) => string
) {
  translatePipelineRef = fn;
}

function translateWhere(
  operator: WhereOperator,
  inputRelation: string
): string {
  const condition = translateExpression(operator.expression);
  return `SELECT * FROM ${inputRelation} WHERE ${condition}`;
}

function translateProject(
  operator: ProjectOperator,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateProjectColumn).join(", ");
  return `SELECT ${columns} FROM ${inputRelation}`;
}

function translateProjectColumn(col: ProjectColumn): string {
  const expr = translateExpression(col.expression);
  if (col.alias) {
    return `${expr} AS ${col.alias}`;
  }
  return expr;
}

function translateProjectAway(
  operator: ProjectAwayOperator,
  inputRelation: string
): string {
  const columnsToRemove = operator.columns.join(", ");
  return `SELECT * EXCLUDE (${columnsToRemove}) FROM ${inputRelation}`;
}

function translateProjectKeep(
  operator: ProjectKeepOperator,
  inputRelation: string
): string {
  const columns = operator.columns.join(", ");
  return `SELECT ${columns} FROM ${inputRelation}`;
}

function translateProjectRename(
  operator: ProjectRenameOperator,
  inputRelation: string
): string {
  const renames = operator.renames
    .map(
      (r: { newName: string; oldName: string }) =>
        `${r.oldName} AS ${r.newName}`
    )
    .join(", ");
  return `SELECT * REPLACE (${renames}) FROM ${inputRelation}`;
}

function translateProjectReorder(
  operator: ProjectReorderOperator,
  inputRelation: string
): string {
  const columns = operator.columns.join(", ");
  return `SELECT ${columns}, * EXCLUDE (${columns}) FROM ${inputRelation}`;
}

function translateExtend(
  operator: ExtendOperator,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateProjectColumn).join(", ");
  return `SELECT *, ${columns} FROM ${inputRelation}`;
}

function translateSort(operator: SortOperator, inputRelation: string): string {
  const orderBy = operator.expressions.map(translateSortExpression).join(", ");
  return `SELECT * FROM ${inputRelation} ORDER BY ${orderBy}`;
}

function translateSortExpression(expr: SortExpression): string {
  const column = translateExpression(expr.expression);
  const direction = expr.direction ? expr.direction.toUpperCase() : "ASC";
  const nullsClause = expr.nulls ? ` NULLS ${expr.nulls.toUpperCase()}` : "";
  return `${column} ${direction}${nullsClause}`;
}

function translateLimit(
  operator: LimitOperator,
  inputRelation: string
): string {
  const count = translateExpression(operator.count);
  return `SELECT * FROM ${inputRelation} LIMIT ${count}`;
}

function translateTake(operator: TakeOperator, inputRelation: string): string {
  const count = translateExpression(operator.count);
  return `SELECT * FROM ${inputRelation} LIMIT ${count}`;
}

function translateTop(operator: TopOperator, inputRelation: string): string {
  const count = translateExpression(operator.count);
  const orderBy = operator.by.map(translateSortExpression).join(", ");
  return `SELECT * FROM ${inputRelation} ORDER BY ${orderBy} LIMIT ${count}`;
}

function translateDistinct(
  operator: DistinctOperator,
  inputRelation: string
): string {
  if (operator.columns.length === 0) {
    return `SELECT DISTINCT * FROM ${inputRelation}`;
  }
  const columns = operator.columns.join(", ");
  return `SELECT DISTINCT ${columns} FROM ${inputRelation}`;
}

function translateSummarize(
  operator: SummarizeOperator,
  inputRelation: string
): string {
  const aggs = operator.aggregations.map(translateAggregation);
  const groups = operator.by.map(translateExpression);
  const selectList = [...groups, ...aggs].join(", ");
  const groupBy = groups.length > 0 ? ` GROUP BY ${groups.join(", ")}` : "";
  return `SELECT ${selectList} FROM ${inputRelation}${groupBy}`;
}

function translateAggregation(agg: Aggregation): string {
  const expr =
    agg.function.type === "FunctionCall"
      ? translateFunctionCall(agg.function as FunctionCall)
      : "NULL";
  if (agg.alias) {
    return `${expr} AS ${agg.alias}`;
  }
  return expr;
}

function translateFunctionCall(func: FunctionCall): string {
  const name = func.name.toUpperCase();
  const args = func.args.map(translateExpression).join(", ");

  if (name === "COUNT") {
    return args ? `COUNT(${args})` : "COUNT(*)";
  }

  return `${name}(${args})`;
}

function translateJoin(operator: JoinOperator, inputRelation: string): string {
  const rightTable =
    operator.rightTable.type === "TableReference"
      ? operator.rightTable.name
      : "(subquery)";
  const kind = operator.kind || "inner";
  const joinType = kind.toUpperCase().replace("UNIQUE", " UNIQUE");
  const conditions = operator.on.map(translateExpression).join(" AND ");
  return `SELECT * FROM ${inputRelation} ${joinType} JOIN ${rightTable} ON ${conditions}`;
}

function translateUnion(
  operator: UnionOperator,
  inputRelation: string
): string {
  const tables = [
    inputRelation,
    ...operator.tables.map((t: TableSource | PipelineExpression) =>
      t.type === "TableReference"
        ? t.name
        : `(${translatePipelineRef(t as PipelineExpression)})`
    ),
  ];
  return tables.join(" UNION ALL ");
}

function translateMvExpand(
  operator: MvExpandOperator,
  inputRelation: string
): string {
  const column = operator.columns[0];
  return `SELECT * REPLACE (UNNEST(${column}) AS ${column}) FROM ${inputRelation}`;
}
