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
    extras: [
      { type: 'PATTERN', value: '\\s' }, // whitespace
      { type: 'PATTERN', value: '//.*' }, // line comments
      { type: 'PATTERN', value: '/\\*[\\s\\S]*?\\*/' }, // block comments
    ],
    conflicts: [
      ['distinct_clause']
    ],
    rules: {
      source_file: rules.sourceFile($),
      _statement: rules._statement($),
      let_statement: rules.letStatement($),
      query_statement: rules.queryStatement($),
      pipe_expression: rules.pipeExpression($),
      operator: rules.operator($),
      table_name: rules.tableName($),
      where_clause: rules.whereClause($),
      project_clause: rules.projectClause($),
      extend_clause: rules.extendClause($),
      summarize_clause: rules.summarizeClause($),
      aggregation_list: rules.aggregationList($),
      aggregation_expression: rules.aggregationExpression($),
      expression_list: rules.expressionList($),
      join_clause: rules.joinClause($),
      join_kind: rules.joinKind($),
      join_conditions: rules.joinConditions($),
      join_condition: rules.joinCondition($),
      union_clause: rules.unionClause($),
      union_kind: rules.unionKind($),
      table_list: rules.tableList($),
      parse_clause: rules.parseClause($),
      parse_kind: rules.parseKind($),
      mv_expand_clause: rules.mvExpandClause($),
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
      conditional_expression: rules.conditionalExpression($),
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
      timespan_literal: rules.timespanLiteral($),
      array_literal: rules.arrayLiteral($),
      array_elements: rules.arrayElements($),
      dynamic_literal: rules.dynamicLiteral($),
      identifier: rules.identifier($),
      qualified_identifier: rules.qualifiedIdentifier($),
      type_cast_expression: rules.typeCastExpression($),
      function_call: rules.functionCall($),
      argument_list: rules.argumentList($),
      argument: rules.argument($),
      named_argument: rules.namedArgument($),
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
