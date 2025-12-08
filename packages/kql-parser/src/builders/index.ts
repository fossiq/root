import type { SyntaxNode } from 'tree-sitter';
import type { ASTNode } from '../types.js';
import {
  buildIdentifier,
  buildStringLiteral,
  buildNumberLiteral,
  buildBooleanLiteral,
  buildNullLiteral,
} from './literals.js';
import {
  buildBinaryExpression,
  buildComparisonExpression,
  buildArithmeticExpression,
  buildStringExpression,
  buildInExpression,
  buildBetweenExpression,
  buildParenthesizedExpression,
} from './expressions.js';
import {
  buildWhereClause,
  buildProjectClause,
  buildExtendClause,
  buildTakeClause,
  buildLimitClause,
  buildSortClause,
  buildDistinctClause,
  buildCountClause,
  buildTopClause,
  buildSearchClause,
  buildColumnAssignment,
} from './operators.js';
import {
  buildSourceFile,
  buildQueryStatement,
  buildPipeExpression,
} from './statements.js';

export * from './literals.js';
export * from './expressions.js';
export * from './operators.js';
export * from './statements.js';

export function buildAST(node: SyntaxNode): ASTNode {
  switch (node.type) {
    case 'source_file':
      return buildSourceFile(node, buildAST);
    case 'query_statement':
      return buildQueryStatement(node, buildAST);
    case 'pipe_expression':
      return buildPipeExpression(node, buildAST);
    case 'where_clause':
      return buildWhereClause(node, buildAST);
    case 'project_clause':
      return buildProjectClause(node, buildAST);
    case 'extend_clause':
      return buildExtendClause(node, buildAST);
    case 'take_clause':
      return buildTakeClause(node);
    case 'limit_clause':
      return buildLimitClause(node);
    case 'sort_clause':
      return buildSortClause(node);
    case 'distinct_clause':
      return buildDistinctClause(node, buildAST);
    case 'count_clause':
      return buildCountClause(node);
    case 'top_clause':
      return buildTopClause(node);
    case 'search_clause':
      return buildSearchClause(node, buildAST);
    case 'column_assignment':
      return buildColumnAssignment(node, buildAST);
    case 'binary_expression':
      return buildBinaryExpression(node, buildAST);
    case 'comparison_expression':
      return buildComparisonExpression(node, buildAST);
    case 'arithmetic_expression':
      return buildArithmeticExpression(node, buildAST);
    case 'string_expression':
      return buildStringExpression(node);
    case 'in_expression':
      return buildInExpression(node, buildAST);
    case 'between_expression':
      return buildBetweenExpression(node, buildAST);
    case 'parenthesized_expression':
      return buildParenthesizedExpression(node, buildAST);
    case 'identifier':
      return buildIdentifier(node);
    case 'string_literal':
      return buildStringLiteral(node);
    case 'number_literal':
      return buildNumberLiteral(node);
    case 'boolean_literal':
      return buildBooleanLiteral(node);
    case 'null_literal':
      return buildNullLiteral(node);
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
