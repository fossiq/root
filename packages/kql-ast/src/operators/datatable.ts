import type { ASTNode } from "../base";
import type { Literal } from "../expressions";

export interface DatatableOperator extends ASTNode {
  type: "DatatableOperator";
  schema: { name: string; type: string }[];
  data: Literal[][];
}
