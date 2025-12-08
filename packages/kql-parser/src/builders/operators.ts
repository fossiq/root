import type { SyntaxNode } from 'tree-sitter';
import type {
  WhereClause,
  ProjectClause,
  ExtendClause,
  TakeClause,
  LimitClause,
  SortClause,
  SortExpression,
  DistinctClause,
  CountClause,
  TopClause,
  SearchClause,
  ColumnExpression,
  ColumnAssignment,
  Expression,
} from '../types.js';
import { buildIdentifier, buildNumberLiteral, buildStringLiteral } from './literals.js';

export function buildWhereClause(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): WhereClause {
  const expr = node.children.find(c => c.type !== 'where');
  if (!expr) {
    throw new Error('Where clause missing expression');
  }
  return {
    type: 'where_clause',
    expression: buildAST(expr) as Expression,
  };
}

export function buildProjectClause(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): ProjectClause {
  const columnList = node.children.find(c => c.type === 'column_list');
  if (!columnList) {
    throw new Error('Project clause missing column list');
  }

  const columns: ColumnExpression[] = [];
  for (let i = 0; i < columnList.childCount; i++) {
    const child = columnList.child(i);
    if (child && (child.type === 'column_expression' || child.type === 'identifier' || child.type === 'column_assignment')) {
      const colExpr = child.type === 'column_expression' ? child.child(0) : child;
      if (colExpr) {
        if (colExpr.type === 'column_assignment') {
          columns.push(buildColumnAssignment(colExpr, buildAST));
        } else if (colExpr.type === 'identifier') {
          columns.push(buildIdentifier(colExpr));
        }
      }
    }
  }

  return {
    type: 'project_clause',
    columns,
  };
}

export function buildExtendClause(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): ExtendClause {
  const columnList = node.children.find(c => c.type === 'column_list');
  if (!columnList) {
    throw new Error('Extend clause missing column list');
  }

  const columns: ColumnExpression[] = [];
  for (let i = 0; i < columnList.childCount; i++) {
    const child = columnList.child(i);
    if (child && (child.type === 'column_expression' || child.type === 'identifier' || child.type === 'column_assignment')) {
      const colExpr = child.type === 'column_expression' ? child.child(0) : child;
      if (colExpr) {
        if (colExpr.type === 'column_assignment') {
          columns.push(buildColumnAssignment(colExpr, buildAST));
        } else if (colExpr.type === 'identifier') {
          columns.push(buildIdentifier(colExpr));
        }
      }
    }
  }

  return {
    type: 'extend_clause',
    columns,
  };
}

export function buildColumnAssignment(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): ColumnAssignment {
  const name = node.child(0);
  const value = node.child(2);

  if (!name || !value) {
    throw new Error('Column assignment missing name or value');
  }

  return {
    type: 'column_assignment',
    name: buildIdentifier(name),
    value: buildAST(value) as Expression,
  };
}

export function buildTakeClause(node: SyntaxNode): TakeClause {
  const count = node.children.find(c => c.type === 'number_literal');
  if (!count) {
    throw new Error('Take clause missing count');
  }
  return {
    type: 'take_clause',
    count: buildNumberLiteral(count),
  };
}

export function buildLimitClause(node: SyntaxNode): LimitClause {
  const count = node.children.find(c => c.type === 'number_literal');
  if (!count) {
    throw new Error('Limit clause missing count');
  }
  return {
    type: 'limit_clause',
    count: buildNumberLiteral(count),
  };
}

export function buildSortClause(node: SyntaxNode): SortClause {
  const sortList = node.children.find(c => c.type === 'sort_expression_list');
  if (!sortList) {
    throw new Error('Sort clause missing expression list');
  }

  const expressions: SortExpression[] = [];
  for (let i = 0; i < sortList.childCount; i++) {
    const child = sortList.child(i);
    if (child && child.type === 'sort_expression') {
      expressions.push(buildSortExpression(child));
    }
  }

  return {
    type: 'sort_clause',
    expressions,
  };
}

export function buildSortExpression(node: SyntaxNode): SortExpression {
  const column = node.children.find(c => c.type === 'identifier');
  if (!column) {
    throw new Error('Sort expression missing column identifier');
  }

  const direction = node.children.find(c => c.text === 'asc' || c.text === 'desc');

  return {
    type: 'sort_expression',
    column: buildIdentifier(column),
    direction: direction?.text as 'asc' | 'desc' | undefined,
  };
}

export function buildDistinctClause(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): DistinctClause {
  const columnList = node.children.find(c => c.type === 'column_list');

  if (!columnList) {
    return {
      type: 'distinct_clause',
    };
  }

  const columns: ColumnExpression[] = [];
  for (let i = 0; i < columnList.childCount; i++) {
    const child = columnList.child(i);
    if (child && (child.type === 'column_expression' || child.type === 'identifier' || child.type === 'column_assignment')) {
      const colExpr = child.type === 'column_expression' ? child.child(0) : child;
      if (colExpr) {
        if (colExpr.type === 'column_assignment') {
          columns.push(buildColumnAssignment(colExpr, buildAST));
        } else if (colExpr.type === 'identifier') {
          columns.push(buildIdentifier(colExpr));
        }
      }
    }
  }

  return {
    type: 'distinct_clause',
    columns,
  };
}

export function buildCountClause(node: SyntaxNode): CountClause {
  return {
    type: 'count_clause',
  };
}

export function buildTopClause(node: SyntaxNode): TopClause {
  const count = node.children.find(c => c.type === 'number_literal');
  if (!count) {
    throw new Error('Top clause missing count');
  }

  const byIndex = node.children.findIndex(c => c.text === 'by');
  if (byIndex !== -1) {
    const column = node.children[byIndex + 1];
    const direction = node.children[byIndex + 2];

    if (column && column.type === 'identifier') {
      return {
        type: 'top_clause',
        count: buildNumberLiteral(count),
        by: {
          column: buildIdentifier(column),
          direction: (direction?.text === 'asc' || direction?.text === 'desc') ? direction.text : undefined,
        },
      };
    }
  }

  return {
    type: 'top_clause',
    count: buildNumberLiteral(count),
  };
}

export function buildSearchClause(node: SyntaxNode, buildAST: (node: SyntaxNode) => any): SearchClause {
  const stringLiteral = node.children.find(c => c.type === 'string_literal');
  if (!stringLiteral) {
    throw new Error('Search clause missing search term');
  }

  const columnList = node.children.find(c => c.type === 'column_list');
  if (!columnList) {
    return {
      type: 'search_clause',
      term: buildStringLiteral(stringLiteral),
    };
  }

  const columns: ColumnExpression[] = [];
  for (let i = 0; i < columnList.childCount; i++) {
    const child = columnList.child(i);
    if (child && (child.type === 'column_expression' || child.type === 'identifier' || child.type === 'column_assignment')) {
      const colExpr = child.type === 'column_expression' ? child.child(0) : child;
      if (colExpr) {
        if (colExpr.type === 'column_assignment') {
          columns.push(buildColumnAssignment(colExpr, buildAST));
        } else if (colExpr.type === 'identifier') {
          columns.push(buildIdentifier(colExpr));
        }
      }
    }
  }

  return {
    type: 'search_clause',
    columns,
    term: buildStringLiteral(stringLiteral),
  };
}
