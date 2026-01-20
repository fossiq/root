import type { ASTNode } from "../base";
import type { Expression } from "../expressions";
import type { PipelineExpression, TableSource } from "../query";

export interface JoinOperator extends ASTNode {
  type: "JoinOperator";
  kind?: string;
  rightTable: TableSource | PipelineExpression;
  on: Expression[];
}
