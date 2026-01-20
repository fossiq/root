import type { ASTNode } from "../base";
import type { PipelineExpression, TableSource } from "../query";

export interface UnionOperator extends ASTNode {
  type: "UnionOperator";
  tables: (TableSource | PipelineExpression)[];
  kind?: string;
  withSource?: string;
}
