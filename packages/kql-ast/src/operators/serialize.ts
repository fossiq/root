import type { ASTNode } from "../base";

export interface SerializeOperator extends ASTNode {
  type: "SerializeOperator";
  columns?: string[];
}
