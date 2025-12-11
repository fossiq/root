/**
 * KQL Grammar Rules
 * Type-safe tree-sitter grammar rules for Kusto Query Language
 */

import type { RuleFunction } from "./types.js";
import { seq, choice, repeat, optional, prec, token } from "./helpers.js";

export const sourceFile: RuleFunction = ($) => repeat($._statement);

export const _statement: RuleFunction = ($) =>
  choice($.let_statement, $.query_statement);

export const letStatement: RuleFunction = ($) =>
  seq("let", $.identifier, "=", $.expression, ";");

export const queryStatement: RuleFunction = ($) =>
  seq($.table_name, repeat($.pipe_expression));

export const pipeExpression: RuleFunction = ($) => seq("|", $.operator);

export const operator: RuleFunction = ($) =>
  choice(
    $.where_clause,
    $.project_clause,
    $.extend_clause,
    $.summarize_clause,
    $.join_clause,
    $.union_clause,
    $.parse_clause,
    $.mv_expand_clause,
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
  prec.left(seq("where", $.expression));

export const projectClause: RuleFunction = ($) => seq("project", $.column_list);

export const extendClause: RuleFunction = ($) => seq("extend", $.column_list);

export const summarizeClause: RuleFunction = ($) =>
  seq("summarize", $.aggregation_list, optional(seq("by", $.expression_list)));

export const aggregationList: RuleFunction = ($) =>
  seq($.aggregation_expression, repeat(seq(",", $.aggregation_expression)));

export const aggregationExpression: RuleFunction = ($) =>
  choice(seq($.identifier, "=", $.expression), $.expression);

export const expressionList: RuleFunction = ($) =>
  seq($.expression, repeat(seq(",", $.expression)));

export const joinClause: RuleFunction = ($) =>
  seq(
    "join",
    optional(seq("kind", "=", $.join_kind)),
    choice(seq("(", $.table_name, ")"), $.table_name),
    "on",
    $.join_conditions
  );

export const joinKind: RuleFunction = (_$) =>
  choice(
    "inner",
    "leftouter",
    "rightouter",
    "leftanti",
    "rightanti",
    "leftsemi",
    "rightsemi",
    "fullouter"
  );

export const joinConditions: RuleFunction = ($) =>
  seq($.join_condition, repeat(seq(",", $.join_condition)));

export const joinCondition: RuleFunction = ($) =>
  choice(
    seq(
      optional("$left."),
      $.identifier,
      "==",
      optional("$right."),
      $.identifier
    ),
    $.identifier
  );

export const unionClause: RuleFunction = ($) =>
  seq(
    "union",
    optional(seq("kind", "=", $.union_kind)),
    optional(seq("isfuzzy", "=", choice("true", "false"))),
    $.table_list
  );

export const unionKind: RuleFunction = (_$) => choice("inner", "outer");

export const tableList: RuleFunction = ($) =>
  seq($.table_name, repeat(seq(",", $.table_name)));

export const parseClause: RuleFunction = ($) =>
  seq(
    "parse",
    optional(seq("kind", "=", $.parse_kind)),
    optional(seq("flags", "=", $.string_literal)), // regex flags
    $.expression,
    "with",
    $.parse_pattern
  );

export const parseKind: RuleFunction = (_$) =>
  choice("simple", "regex", "relaxed");

export const parsePattern: RuleFunction = ($) =>
  seq(
    optional("*"), // leading wildcard
    $.string_literal, // pattern string
    repeat(
      seq(
        $.identifier, // column name
        optional(seq(":", $.identifier)), // optional type (:string, :int, etc)
        optional($.string_literal) // optional separator/pattern after column
      )
    ),
    optional("*") // trailing wildcard
  );

export const mvExpandClause: RuleFunction = ($) =>
  seq(
    choice("mv-expand", "mvexpand"),
    $.expression,
    optional(seq("to", "typeof", "(", $.identifier, ")")),
    optional(seq("limit", $.number_literal))
  );

export const takeClause: RuleFunction = ($) => seq("take", $.number_literal);

export const limitClause: RuleFunction = ($) => seq("limit", $.number_literal);

export const topClause: RuleFunction = ($) =>
  seq(
    "top",
    $.number_literal,
    optional(seq("by", $.identifier, optional(choice("asc", "desc"))))
  );

export const searchClause: RuleFunction = ($) =>
  seq("search", optional(seq("in", "(", $.column_list, ")")), $.string_literal);

export const sortClause: RuleFunction = ($) =>
  seq("sort", optional("by"), $.sort_expression_list);

export const orderClause: RuleFunction = ($) =>
  seq("order", "by", $.sort_expression_list);

export const sortExpressionList: RuleFunction = ($) =>
  seq($.sort_expression, repeat(seq(",", $.sort_expression)));

export const sortExpression: RuleFunction = ($) =>
  seq($.identifier, optional(choice("asc", "desc")));

export const distinctClause: RuleFunction = ($) =>
  choice(
    prec.dynamic(1, seq("distinct", $.column_list)),
    prec.dynamic(0, "distinct")
  );

export const countClause: RuleFunction = (_$) => ({
  type: "STRING",
  value: "count",
});

export const columnList: RuleFunction = ($) =>
  seq($.column_expression, repeat(seq(",", $.column_expression)));

export const columnExpression: RuleFunction = ($) =>
  choice($.column_assignment, $.expression);

export const columnAssignment: RuleFunction = ($) =>
  seq($.identifier, "=", $.expression);

export const expression: RuleFunction = ($) =>
  choice(
    $.binary_expression,
    $.comparison_expression,
    $.arithmetic_expression,
    $.string_expression,
    $.in_expression,
    $.between_expression,
    $.parenthesized_expression,
    $.conditional_expression,
    $.type_cast_expression,
    $.function_call,
    $.literal,
    $.qualified_identifier,
    $.identifier
  );

export const conditionalExpression: RuleFunction = ($) =>
  choice(
    seq("iff", "(", $.expression, ",", $.expression, ",", $.expression, ")"),
    seq("case", "(", $.expression, repeat(seq(",", $.expression)), ")")
  );

export const binaryExpression: RuleFunction = ($) =>
  prec.left(1, seq($.expression, choice("and", "or"), $.expression));

export const comparisonExpression: RuleFunction = ($) =>
  prec.left(
    2,
    seq($.expression, choice("==", "!=", ">", "<", ">=", "<="), $.expression)
  );

export const arithmeticExpression: RuleFunction = ($) =>
  choice(
    prec.left(4, seq($.expression, choice("*", "/", "%"), $.expression)),
    prec.left(3, seq($.expression, choice("+", "-"), $.expression))
  );

export const parenthesizedExpression: RuleFunction = ($) =>
  seq("(", $.expression, ")");

export const stringExpression: RuleFunction = ($) =>
  prec.left(
    2,
    seq(
      $.identifier,
      choice("contains", "startswith", "endswith", "matches", "has"),
      $.string_literal
    )
  );

export const inExpression: RuleFunction = ($) =>
  prec.left(2, seq($.identifier, "in", "(", $.literal_list, ")"));

export const betweenExpression: RuleFunction = ($) =>
  prec.left(
    2,
    seq(
      $.identifier,
      "between",
      "(",
      $.between_value,
      "..",
      $.between_value,
      ")"
    )
  );

// between_value can be a literal or an expression (like ago(1y), now(), datetime())
export const betweenValue: RuleFunction = ($) =>
  choice($.literal, $.function_call);

export const literalList: RuleFunction = ($) =>
  seq($.literal, repeat(seq(",", $.literal)));

export const literal: RuleFunction = ($) =>
  choice(
    $.string_literal,
    $.number_literal,
    $.boolean_literal,
    $.null_literal,
    $.timespan_literal,
    $.array_literal,
    $.dynamic_literal
  );

export const dynamicLiteral: RuleFunction = ($) =>
  seq(
    "dynamic",
    "(",
    choice($.string_literal, $.array_literal, $.number_literal),
    ")"
  );

export const stringLiteral: RuleFunction = (_$) =>
  choice(seq('"', /[^"]*/, '"'), seq("'", /[^']*/, "'"));

export const numberLiteral: RuleFunction = (_$) => ({
  type: "PATTERN",
  value: "\\d+(\\.\\d+)?",
});

export const booleanLiteral: RuleFunction = (_$) => choice("true", "false");

export const nullLiteral: RuleFunction = (_$) => ({
  type: "STRING",
  value: "null",
});

export const identifier: RuleFunction = ($) =>
  choice(/[a-zA-Z_][a-zA-Z0-9_]*/, prec(1, seq("[", $.string_literal, "]")));

export const qualifiedIdentifier: RuleFunction = ($) =>
  seq($.identifier, ".", $.identifier);

export const typeCastExpression: RuleFunction = ($) =>
  choice(
    seq($.expression, "::", $.identifier),
    seq("to", $.identifier, "(", $.expression, ")")
  );

export const timespanLiteral: RuleFunction = (_$) => ({
  type: "PATTERN",
  value: "\\d+(\\.\\d+)?(d|h|m|s|ms|microsecond|tick)",
});

export const functionCall: RuleFunction = ($) =>
  seq($.identifier, "(", optional($.argument_list), ")");

export const argumentList: RuleFunction = ($) =>
  seq($.argument, repeat(seq(",", $.argument)));

export const argument: RuleFunction = ($) =>
  choice($.named_argument, $.expression);

export const namedArgument: RuleFunction = ($) =>
  seq($.identifier, "=", $.expression);

export const arrayLiteral: RuleFunction = ($) =>
  seq("[", optional($.array_elements), "]");

export const arrayElements: RuleFunction = ($) =>
  seq($.expression, repeat(seq(",", $.expression)));

export const lineComment: RuleFunction = (_$) => token(seq("//", /[^\r\n]*/));

export const blockComment: RuleFunction = (_$) =>
  token(seq("/*", /[^*]*\*+(?:[^/*][^*]*\*+)*/, "/"));
