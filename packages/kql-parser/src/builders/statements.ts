import type { SyntaxNode } from 'tree-sitter';
import type {
  SourceFile,
  QueryStatement,
  PipeExpression,
  Operator,
} from '../types.js';
import { buildIdentifier } from './literals.js';

export function buildSourceFile(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): SourceFile {
  const statements: QueryStatement[] = [];
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === 'query_statement') {
      statements.push(buildQueryStatement(child, buildAST));
    }
  }
  return { type: 'source_file', statements };
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
