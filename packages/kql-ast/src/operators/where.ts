import type { ASTNode } from "../base";
import type { Expression } from "../expressions";

export interface WhereOperator extends ASTNode {
  type: "WhereOperator";
  expression: Expression;
}
