import type { SyntaxNode } from 'tree-sitter';
import type {
  SourceFile,
  Statement,
  LetStatement,
  QueryStatement,
  PipeExpression,
  Operator,
  Expression,
} from '../types.js';
import { buildIdentifier } from './literals.js';

export function buildSourceFile(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): SourceFile {
  const statements: Statement[] = [];
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'let_statement') {
      statements.push(buildLetStatement(child, buildAST));
    } else if (child && child.type === 'query_statement') {
      statements.push(buildQueryStatement(child, buildAST));
    }
  }
  return { type: 'source_file', statements };
}

export function buildLetStatement(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): LetStatement {
  const nameNode = node.children.find(c => c.type === 'identifier');
  if (!nameNode) {
    throw new Error('Let statement missing variable name');
  }

  const exprNode = node.children.find(c => c.type === 'expression' || c.type.includes('_expression') || c.type === 'literal' || c.type === 'function_call');
  if (!exprNode) {
    throw new Error('Let statement missing value expression');
  }

  return {
    type: 'let_statement',
    name: buildIdentifier(nameNode),
    value: buildAST(exprNode) as Expression,
  };
}

export function buildQueryStatement(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): QueryStatement {
  const table = node.child(0);
  const pipes: PipeExpression[] = [];

  if (!table) {
    throw new Error('Query statement missing table name');
  }

  for (let i = 1; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'pipe_expression') {
      pipes.push(buildPipeExpression(child, buildAST));
    }
  }

  return {
    type: 'query_statement',
    table: buildIdentifier(table),
    pipes,
  };
}

export function buildPipeExpression(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): PipeExpression {
  const operator = node.children.find(c => c.type !== '|');
  if (!operator) {
    throw new Error('Pipe expression missing operator');
  }
  return {
    type: 'pipe_expression',
    operator: buildAST(operator) as Operator,
  };
}
