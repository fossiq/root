/**
 * KQL Grammar Definition
 * Main entry point for the tree-sitter grammar configuration
 */

import type { GrammarConfig, RuleBuilder } from './types.js';
import * as rules from './rules.js';

/**
 * Creates the grammar configuration object for tree-sitter
 */
export function createGrammar(): GrammarConfig {
  const $ = createRuleBuilder();

  return {
    name: 'kql',
    conflicts: [
      ['distinct_clause']
    ],
    rules: {
      source_file: rules.sourceFile($),
      _statement: rules._statement($),
      query_statement: rules.queryStatement($),
      pipe_expression: rules.pipeExpression($),
      operator: rules.operator($),
      table_name: rules.tableName($),
      where_clause: rules.whereClause($),
      project_clause: rules.projectClause($),
      extend_clause: rules.extendClause($),
      take_clause: rules.takeClause($),
      limit_clause: rules.limitClause($),
      top_clause: rules.topClause($),
      search_clause: rules.searchClause($),
      sort_clause: rules.sortClause($),
      order_clause: rules.orderClause($),
      sort_expression_list: rules.sortExpressionList($),
      sort_expression: rules.sortExpression($),
      distinct_clause: rules.distinctClause($),
      count_clause: rules.countClause($),
      column_list: rules.columnList($),
      column_expression: rules.columnExpression($),
      column_assignment: rules.columnAssignment($),
      expression: rules.expression($),
      binary_expression: rules.binaryExpression($),
      comparison_expression: rules.comparisonExpression($),
      arithmetic_expression: rules.arithmeticExpression($),
      parenthesized_expression: rules.parenthesizedExpression($),
      string_expression: rules.stringExpression($),
      in_expression: rules.inExpression($),
      between_expression: rules.betweenExpression($),
      literal_list: rules.literalList($),
      literal: rules.literal($),
      string_literal: rules.stringLiteral($),
      number_literal: rules.numberLiteral($),
      boolean_literal: rules.booleanLiteral($),
      null_literal: rules.nullLiteral($),
      identifier: rules.identifier($),
    },
  };
}

/**
 * Creates a rule builder that references rules by name
 */
function createRuleBuilder(): RuleBuilder {
  return new Proxy({} as RuleBuilder, {
    get(_target, prop: string) {
      return {
        type: 'SYMBOL',
        name: prop,
      };
    },
  });
}

export * from './types.js';
export * from './helpers.js';
export * from './rules.js';
