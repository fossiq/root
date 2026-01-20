import type { ASTNode } from "../base";

export interface ParseOperator extends ASTNode {
  type: "ParseOperator";
  column: string;
  kind?: "simple" | "regex" | "relaxed";
  pattern: string;
}
