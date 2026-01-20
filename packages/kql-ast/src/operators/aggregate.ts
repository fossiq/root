import type { ASTNode, ErrorNode } from "../base";
import type { Expression, FunctionCall } from "../expressions";

export interface DistinctOperator extends ASTNode {
  type: "DistinctOperator";
  columns: string[];
}

export interface SummarizeOperator extends ASTNode {
  type: "SummarizeOperator";
  aggregations: Aggregation[];
  by: Expression[];
}

export interface Aggregation extends ASTNode {
  type: "Aggregation";
  alias?: string;
  function: FunctionCall | ErrorNode;
}

export interface MvExpandOperator extends ASTNode {
  type: "MvExpandOperator";
  columns: string[];
}
