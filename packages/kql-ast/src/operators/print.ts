import type { ASTNode } from "../base";
import type { ProjectColumn } from "./project";

export interface PrintOperator extends ASTNode {
  type: "PrintOperator";
  expressions: ProjectColumn[];
}
