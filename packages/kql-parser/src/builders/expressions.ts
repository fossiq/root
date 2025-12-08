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
  ConditionalExpression,
  FunctionCall,
  NamedArgument,
  TypeCastExpression,
  Literal,
  ASTNode,
} from '../types.js';
import { buildIdentifier, buildStringLiteral } from './literals.js';

export function buildBinaryExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): BinaryExpression {
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

export function buildComparisonExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): ComparisonExpression {
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

export function buildArithmeticExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): ArithmeticExpression {
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

export function buildParenthesizedExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): ParenthesizedExpression {
  const expr = node.children.find(c => c.type !== '(' && c.type !== ')');
  if (!expr) {
    throw new Error('Parenthesized expression missing expression');
  }
  return {
    type: 'parenthesized_expression',
    expression: buildAST(expr) as Expression,
  };
}

export function buildConditionalExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): ConditionalExpression {
  // Determine function type (iff or case)
  const functionName = node.child(0)?.text;
  if (functionName !== 'iff' && functionName !== 'case') {
    throw new Error('Conditional expression must be iff or case');
  }

  // Collect all expression arguments
  const args: Expression[] = [];
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && (child.type === 'expression' || child.type.includes('_expression') || child.type === 'identifier' || child.type === 'literal')) {
      args.push(buildAST(child) as Expression);
    }
  }

  return {
    type: 'conditional_expression',
    function: functionName as 'iff' | 'case',
    arguments: args,
  };
}

export function buildFunctionCall(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): FunctionCall {
  const nameNode = node.child(0);
  if (!nameNode || nameNode.type !== 'identifier') {
    throw new Error('Function call missing name');
  }

  const argList = node.children.find(c => c.type === 'argument_list');
  const args: (Expression | NamedArgument)[] = [];

  if (argList) {
    for (let i = 0; i < argList.childCount; i++) {
      const child = argList.child(i);
      if (child && child.type === 'argument') {
        const argChild = child.child(0);
        if (argChild) {
          if (argChild.type === 'named_argument') {
            args.push(buildNamedArgument(argChild, buildAST));
          } else {
            args.push(buildAST(argChild) as Expression);
          }
        }
      } else if (child && child.type !== ',') {
        // Handle expressions directly
        args.push(buildAST(child) as Expression);
      }
    }
  }

  return {
    type: 'function_call',
    name: buildIdentifier(nameNode),
    arguments: args,
  };
}

export function buildNamedArgument(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): NamedArgument {
  const nameNode = node.child(0);
  const valueNode = node.child(2); // Skip '='

  if (!nameNode || !valueNode) {
    throw new Error('Named argument missing name or value');
  }

  return {
    type: 'named_argument',
    name: buildIdentifier(nameNode),
    value: buildAST(valueNode) as Expression,
  };
}

export function buildTypeCastExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): TypeCastExpression {
  // Check if it's :: syntax (expr :: type) or to syntax (to type(expr))
  const hasDoubleColon = node.children.some(c => c.text === '::');

  if (hasDoubleColon) {
    // expr :: type
    const expr = node.child(0);
    const typeNode = node.child(2); // Skip '::'

    if (!expr || !typeNode) {
      throw new Error('Type cast expression missing expression or type');
    }

    return {
      type: 'type_cast_expression',
      expression: buildAST(expr) as Expression,
      targetType: typeNode.text,
    };
  } else {
    // to type(expr)
    const typeNode = node.child(1); // After 'to'
    const expr = node.children.find(c => c.type === 'expression' || c.type.includes('_expression') || c.type === 'identifier');

    if (!typeNode || !expr) {
      throw new Error('Type cast expression missing type or expression');
    }

    return {
      type: 'type_cast_expression',
      expression: buildAST(expr) as Expression,
      targetType: typeNode.text,
    };
  }
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

export function buildInExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): InExpression {
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

export function buildBetweenExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => ASTNode): BetweenExpression {
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
