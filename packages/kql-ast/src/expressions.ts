/**
 * Expression types.
 */
import type { ASTNode, ErrorNode } from "./base";

export type ExpressionType =
  | "BinaryExpression"
  | "UnaryExpression"
  | "FunctionCall"
  | "Identifier"
  | "Literal"
  | "ParenthesizedExpression"
  | "NumberLiteral"
  | "StringLiteral";

export interface BinaryExpression extends ASTNode {
  type: "BinaryExpression";
  left: Expression;
  operator: string;
  right: Expression;
}

export interface FunctionCall extends ASTNode {
  type: "FunctionCall";
  name: string;
  args: Expression[];
}

export interface Identifier extends ASTNode {
  type: "Identifier";
  name: string;
}

export interface Literal extends ASTNode {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
}

export interface NumberLiteral extends ASTNode {
  type: "NumberLiteral";
  value: number;
  raw: string;
}

export interface StringLiteral extends ASTNode {
  type: "StringLiteral";
  value: string;
  raw: string;
}

export interface UnaryExpression extends ASTNode {
  type: "UnaryExpression";
  operator: string;
  operand: Expression;
}

export interface ParenthesizedExpression extends ASTNode {
  type: "ParenthesizedExpression";
  expression: Expression;
}

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | FunctionCall
  | Identifier
  | Literal
  | ParenthesizedExpression
  | NumberLiteral
  | StringLiteral
  | ErrorNode;
