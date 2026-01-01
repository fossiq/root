import type { ASTNode } from "../base";

export interface RenderOperator extends ASTNode {
  type: "RenderOperator";
  chartType: string;
  options?: Record<string, string>;
}
