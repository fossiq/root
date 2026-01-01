/**
 * Statement-related AST nodes.
 */
import type { ASTNode } from "./base";
import type { Expression, Identifier, Literal } from "./expressions";

export interface LetStatement extends ASTNode {
  type: "LetStatement";
  name: string;
  value: Expression;
}

export interface SetStatement extends ASTNode {
  type: "SetStatement";
  name: string;
  value: Literal | Identifier;
}

export interface DeclareQueryParametersStatement extends ASTNode {
  type: "DeclareQueryParametersStatement";
  parameters: QueryParameter[];
}

export interface QueryParameter extends ASTNode {
  type: "QueryParameter";
  name: string;
  paramType: string;
  defaultValue?: Expression;
}
