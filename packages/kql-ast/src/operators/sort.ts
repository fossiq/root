import type { ASTNode } from "../base";
import type { Expression } from "../expressions";

export interface SortOperator extends ASTNode {
  type: "SortOperator";
  expressions: SortExpression[];
}

export interface SortExpression extends ASTNode {
  type: "SortExpression";
  expression: Expression;
  direction?: string;
  nulls?: string;
}

export interface LimitOperator extends ASTNode {
  type: "LimitOperator";
  count: Expression;
}

export interface TakeOperator extends ASTNode {
  type: "TakeOperator";
  count: Expression;
}

export interface TopOperator extends ASTNode {
  type: "TopOperator";
  count: Expression;
  by: SortExpression[];
}
