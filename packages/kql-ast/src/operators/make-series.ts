import type { ASTNode } from "../base";
import type { Expression } from "../expressions";
import type { Aggregation } from "./aggregate";
import type { SortExpression } from "./sort";

export interface MakeSeriesOperator extends ASTNode {
  type: "MakeSeriesOperator";
  aggregations: Aggregation[];
  on: SortExpression;
  step: Expression;
  by?: Expression[];
}
