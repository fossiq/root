import type {
  SortOperator,
  SortExpression,
  LimitOperator,
  TakeOperator,
  TopOperator,
  DistinctOperator,
} from "@fossiq/kql-ast";
import { translateExpression } from "../expressions";

export function translateSort(
  operator: SortOperator,
  inputRelation: string
): string {
  const orderBy = operator.expressions.map(translateSortExpression).join(", ");
  return `SELECT * FROM ${inputRelation} ORDER BY ${orderBy}`;
}

export function translateSortExpression(expr: SortExpression): string {
  const column = translateExpression(expr.expression);
  const direction = expr.direction ? expr.direction.toUpperCase() : "ASC";
  const nullsClause = expr.nulls ? ` NULLS ${expr.nulls.toUpperCase()}` : "";
  return `${column} ${direction}${nullsClause}`;
}

export function translateLimit(
  operator: LimitOperator,
  inputRelation: string
): string {
  const count = translateExpression(operator.count);
  return `SELECT * FROM ${inputRelation} LIMIT ${count}`;
}

export function translateTake(
  operator: TakeOperator,
  inputRelation: string
): string {
  const count = translateExpression(operator.count);
  return `SELECT * FROM ${inputRelation} LIMIT ${count}`;
}

export function translateTop(
  operator: TopOperator,
  inputRelation: string
): string {
  const count = translateExpression(operator.count);
  const orderBy = operator.by.map(translateSortExpression).join(", ");
  return `SELECT * FROM ${inputRelation} ORDER BY ${orderBy} LIMIT ${count}`;
}

export function translateDistinct(
  operator: DistinctOperator,
  inputRelation: string
): string {
  if (operator.columns.length === 0) {
    return `SELECT DISTINCT * FROM ${inputRelation}`;
  }
  const columns = operator.columns.join(", ");
  return `SELECT DISTINCT ${columns} FROM ${inputRelation}`;
}
