import type { ASTNode } from "../base";
import type { Expression } from "../expressions";

export interface SampleOperator extends ASTNode {
  type: "SampleOperator";
  count: Expression;
  kind?: string;
}
