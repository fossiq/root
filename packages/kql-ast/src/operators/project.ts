import type { ASTNode } from "../base";
import type { Expression } from "../expressions";

export interface ProjectOperator extends ASTNode {
  type: "ProjectOperator";
  columns: ProjectColumn[];
}

export interface ProjectColumn extends ASTNode {
  type: "ProjectColumn";
  expression: Expression;
  alias?: string;
}

export interface ProjectAwayOperator extends ASTNode {
  type: "ProjectAwayOperator";
  columns: string[];
}

export interface ProjectKeepOperator extends ASTNode {
  type: "ProjectKeepOperator";
  columns: string[];
}

export interface ProjectRenameOperator extends ASTNode {
  type: "ProjectRenameOperator";
  renames: { newName: string; oldName: string }[];
}

export interface ProjectReorderOperator extends ASTNode {
  type: "ProjectReorderOperator";
  columns: string[];
}

export interface ExtendOperator extends ASTNode {
  type: "ExtendOperator";
  columns: ProjectColumn[];
}
