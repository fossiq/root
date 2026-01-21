import type { WhereOperator } from "@fossiq/kql-ast";
import { translateExpression } from "../expressions";

export function translateWhere(
  operator: WhereOperator,
  inputRelation: string
): string {
  const condition = translateExpression(operator.expression);
  return `SELECT * FROM ${inputRelation} WHERE ${condition}`;
}
