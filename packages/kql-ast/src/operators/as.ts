import type { ASTNode } from "../base";

export interface AsOperator extends ASTNode {
  type: "AsOperator";
  name: string;
  materialized?: boolean;
}
