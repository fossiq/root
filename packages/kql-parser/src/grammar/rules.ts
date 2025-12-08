/**
 * KQL Grammar Rules
 * Type-safe tree-sitter grammar rules for Kusto Query Language
 */

import type { RuleFunction, RuleBuilder } from './types.js';
import { seq, choice, repeat, optional, prec } from './helpers.js';

export const sourceFile: RuleFunction = ($) => repeat($._statement);

export const _statement: RuleFunction = ($) => choice($.query_statement);

export const queryStatement: RuleFunction = ($) =>
  seq($.table_name, repeat($.pipe_expression));

export const pipeExpression: RuleFunction = ($) =>
  seq('|', $.operator);

export const operator: RuleFunction = ($) =>
  choice(
    $.where_clause,
    $.project_clause,
    $.extend_clause,
    $.take_clause,
    $.limit_clause,
    $.sort_clause,
    $.order_clause,
    $.distinct_clause,
    $.count_clause,
    $.top_clause,
    $.search_clause
  );

export const tableName: RuleFunction = ($) => $.identifier;

export const whereClause: RuleFunction = ($) =>
  prec.left(seq('where', $.expression));

export const projectClause: RuleFunction = ($) =>
  seq('project', $.column_list);

export const extendClause: RuleFunction = ($) =>
  seq('extend', $.column_list);

export const takeClause: RuleFunction = ($) =>
  seq('take', $.number_literal);

export const limitClause: RuleFunction = ($) =>
  seq('limit', $.number_literal);

export const topClause: RuleFunction = ($) =>
  seq(
    'top',
    $.number_literal,
    optional(seq('by', $.identifier, optional(choice('asc', 'desc'))))
  );

export const searchClause: RuleFunction = ($) =>
  seq(
    'search',
    optional(seq('in', '(', $.column_list, ')')),
    $.string_literal
  );

export const sortClause: RuleFunction = ($) =>
  seq('sort', optional('by'), $.sort_expression_list);

export const orderClause: RuleFunction = ($) =>
  seq('order', 'by', $.sort_expression_list);

export const sortExpressionList: RuleFunction = ($) =>
  seq($.sort_expression, repeat(seq(',', $.sort_expression)));

export const sortExpression: RuleFunction = ($) =>
  seq($.identifier, optional(choice('asc', 'desc')));

export const distinctClause: RuleFunction = ($) =>
  choice(
    prec.dynamic(1, seq('distinct', $.column_list)),
    prec.dynamic(0, 'distinct')
  );

export const countClause: RuleFunction = ($) => ({
  type: 'STRING',
  value: 'count',
});

export const columnList: RuleFunction = ($) =>
  seq($.column_expression, repeat(seq(',', $.column_expression)));

export const columnExpression: RuleFunction = ($) =>
  choice($.identifier, $.column_assignment);

export const columnAssignment: RuleFunction = ($) =>
  seq($.identifier, '=', $.expression);

export const expression: RuleFunction = ($) =>
  choice(
    $.binary_expression,
    $.comparison_expression,
    $.arithmetic_expression,
    $.string_expression,
    $.in_expression,
    $.between_expression,
    $.parenthesized_expression,
    $.literal,
    $.identifier
  );

export const binaryExpression: RuleFunction = ($) =>
  prec.left(1, seq($.expression, choice('and', 'or'), $.expression));

export const comparisonExpression: RuleFunction = ($) =>
  prec.left(
    2,
    seq($.identifier, choice('==', '!=', '>', '<', '>=', '<='), $.literal)
  );

export const arithmeticExpression: RuleFunction = ($) =>
  choice(
    prec.left(4, seq($.expression, choice('*', '/', '%'), $.expression)),
    prec.left(3, seq($.expression, choice('+', '-'), $.expression))
  );

export const parenthesizedExpression: RuleFunction = ($) =>
  seq('(', $.expression, ')');

export const stringExpression: RuleFunction = ($) =>
  prec.left(
    2,
    seq(
      $.identifier,
      choice('contains', 'startswith', 'endswith', 'matches', 'has'),
      $.string_literal
    )
  );

export const inExpression: RuleFunction = ($) =>
  prec.left(2, seq($.identifier, 'in', '(', $.literal_list, ')'));

export const betweenExpression: RuleFunction = ($) =>
  prec.left(2, seq($.identifier, 'between', '(', $.literal, '..', $.literal, ')'));

export const literalList: RuleFunction = ($) =>
  seq($.literal, repeat(seq(',', $.literal)));

export const literal: RuleFunction = ($) =>
  choice($.string_literal, $.number_literal, $.boolean_literal, $.null_literal);

export const stringLiteral: RuleFunction = ($) =>
  choice(seq('"', /[^"]*/, '"'), seq("'", /[^']*/, "'"));

export const numberLiteral: RuleFunction = ($) => ({
  type: 'PATTERN',
  value: '\\d+(\\.\\d+)?',
});

export const booleanLiteral: RuleFunction = ($) => choice('true', 'false');

export const nullLiteral: RuleFunction = ($) => ({
  type: 'STRING',
  value: 'null',
});

export const identifier: RuleFunction = ($) => ({
  type: 'PATTERN',
  value: '[a-zA-Z_][a-zA-Z0-9_]*',
});
