import type { SyntaxNode } from 'tree-sitter';
import type {
  Expression,
  BinaryExpression,
  ComparisonExpression,
  ArithmeticExpression,
  StringExpression,
  InExpression,
  BetweenExpression,
  ParenthesizedExpression,
  Literal,
  StringLiteral,
} from '../types.js';
import { buildIdentifier, buildStringLiteral } from './literals.js';

export function buildBinaryExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): BinaryExpression {
  const left = node.child(0);
  const operator = node.child(1);
  const right = node.child(2);

  if (!left || !operator || !right) {
    throw new Error('Binary expression missing operands');
  }

  return {
    type: 'binary_expression',
    operator: operator.text as 'and' | 'or',
    left: buildAST(left) as Expression,
    right: buildAST(right) as Expression,
  };
}

export function buildComparisonExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): ComparisonExpression {
  const left = node.child(0);
  const operator = node.child(1);
  const right = node.child(2);

  if (!left || !operator || !right) {
    throw new Error('Comparison expression missing operands');
  }

  return {
    type: 'comparison_expression',
    operator: operator.text as '==' | '!=' | '>' | '<' | '>=' | '<=',
    left: buildIdentifier(left),
    right: buildAST(right) as Literal,
  };
}

export function buildArithmeticExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): ArithmeticExpression {
  const left = node.child(0);
  const operator = node.child(1);
  const right = node.child(2);

  if (!left || !operator || !right) {
    throw new Error('Arithmetic expression missing operands');
  }

  return {
    type: 'arithmetic_expression',
    operator: operator.text as '+' | '-' | '*' | '/' | '%',
    left: buildAST(left) as Expression,
    right: buildAST(right) as Expression,
  };
}

export function buildParenthesizedExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): ParenthesizedExpression {
  const expr = node.children.find(c => c.type !== '(' && c.type !== ')');
  if (!expr) {
    throw new Error('Parenthesized expression missing inner expression');
  }

  return {
    type: 'parenthesized_expression',
    expression: buildAST(expr) as Expression,
  };
}

export function buildStringExpression(node: SyntaxNode): StringExpression {
  const left = node.child(0);
  const operator = node.child(1);
  const right = node.child(2);

  if (!left || !operator || !right) {
    throw new Error('String expression missing operands');
  }

  return {
    type: 'string_expression',
    operator: operator.text as 'contains' | 'startswith' | 'endswith' | 'matches' | 'has',
    left: buildIdentifier(left),
    right: buildStringLiteral(right),
  };
}

export function buildInExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): InExpression {
  const left = node.child(0);
  const literalList = node.children.find(c => c.type === 'literal_list');

  if (!left) {
    throw new Error('In expression missing left operand');
  }

  if (!literalList) {
    throw new Error('In expression missing literal list');
  }

  const values: Literal[] = [];
  for (let i = 0; i < literalList.childCount; i++) {
    const child = literalList.child(i);
    if (child && (child.type === 'string_literal' || child.type === 'number_literal' || child.type === 'boolean_literal' || child.type === 'null_literal')) {
      values.push(buildAST(child) as Literal);
    }
  }

  return {
    type: 'in_expression',
    left: buildIdentifier(left),
    values,
  };
}

export function buildBetweenExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): BetweenExpression {
  const left = node.child(0);
  const literals = node.children.filter(c =>
    c.type === 'string_literal' ||
    c.type === 'number_literal' ||
    c.type === 'boolean_literal' ||
    c.type === 'null_literal'
  );

  if (!left) {
    throw new Error('Between expression missing left operand');
  }

  if (literals.length !== 2) {
    throw new Error('Between expression requires exactly two literal values');
  }

  return {
    type: 'between_expression',
    left: buildIdentifier(left),
    min: buildAST(literals[0]) as Literal,
    max: buildAST(literals[1]) as Literal,
  };
}
