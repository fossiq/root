import type {
  SummarizeOperator,
  Aggregation,
  FunctionCall,
} from "@fossiq/kql-ast";
import { translateExpression } from "../expressions";

export function translateSummarize(
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
