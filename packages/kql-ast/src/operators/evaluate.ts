import type { ASTNode } from "../base";
import type { FunctionCall } from "../expressions";

export interface EvaluateOperator extends ASTNode {
  type: "EvaluateOperator";
  plugin: FunctionCall;
}
