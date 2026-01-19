import type { ASTNode } from "../base";
import type { PipelineExpression } from "../query";

export interface PartitionOperator extends ASTNode {
  type: "PartitionOperator";
  by: string;
  pipeline: PipelineExpression;
}
