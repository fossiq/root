import type { SyntaxNode } from "tree-sitter";
import type { ASTNode } from "../types.js";
import {
  buildIdentifier,
  buildQualifiedIdentifier,
  buildStringLiteral,
  buildNumberLiteral,
  buildBooleanLiteral,
  buildNullLiteral,
  buildDynamicLiteral,
  buildDatetimeLiteral,
  buildTimespanLiteral,
} from "./literals.js";
import {
  buildBinaryExpression,
  buildComparisonExpression,
  buildArithmeticExpression,
  buildStringExpression,
  buildInExpression,
  buildBetweenExpression,
  buildParenthesizedExpression,
  buildConditionalExpression,
  buildFunctionCall,
  buildNamedArgument,
  buildTypeCastExpression,
} from "./expressions.js";
import {
  buildWhereClause,
  buildProjectClause,
  buildProjectAwayClause,
  buildProjectKeepClause,
  buildProjectRenameClause,
  buildProjectReorderClause,
  buildExtendClause,
  buildSummarizeClause,
  buildAggregationExpression,
  buildJoinClause,
  buildUnionClause,
  buildParseClause,
  buildMvExpandClause,
  buildTakeClause,
  buildLimitClause,
  buildSortClause,
  buildDistinctClause,
  buildCountClause,
  buildTopClause,
  buildSearchClause,
  buildColumnAssignment,
} from "./operators.js";
import {
  buildSourceFile,
  buildLetStatement,
  buildQueryStatement,
  buildPipeExpression,
} from "./statements.js";

export * from "./literals.js";
export * from "./expressions.js";
export * from "./operators.js";
export * from "./statements.js";

export function buildAST(node: SyntaxNode): ASTNode {
  switch (node.type) {
    case "source_file":
      return buildSourceFile(node, buildAST);
    case "let_statement":
      return buildLetStatement(node, buildAST);
    case "query_statement":
      return buildQueryStatement(node, buildAST);
    case "pipe_expression":
      return buildPipeExpression(node, buildAST);
    case "operator":
      return buildAST(node.firstNamedChild!);
    case "expression":
      return buildAST(node.firstNamedChild!);
    case "literal":
      return buildAST(node.firstNamedChild!);
    case "where_clause":
      return buildWhereClause(node, buildAST);
    case "project_clause":
      return buildProjectClause(node, buildAST);
    case "project_away_clause":
      return buildProjectAwayClause(node, buildAST);
    case "project_keep_clause":
      return buildProjectKeepClause(node, buildAST);
    case "project_rename_clause":
      return buildProjectRenameClause(node, buildAST);
    case "project_reorder_clause":
      return buildProjectReorderClause(node, buildAST);
    case "extend_clause":
      return buildExtendClause(node, buildAST);
    case "summarize_clause":
      return buildSummarizeClause(node, buildAST);
    case "aggregation_expression":
      return buildAggregationExpression(node, buildAST);
    case "join_clause":
      return buildJoinClause(node);
    case "union_clause":
      return buildUnionClause(node);
    case "parse_clause":
      return buildParseClause(node, buildAST);
    case "mv_expand_clause":
      return buildMvExpandClause(node, buildAST);
    case "take_clause":
      return buildTakeClause(node);
    case "limit_clause":
      return buildLimitClause(node);
    case "sort_clause":
      return buildSortClause(node);
    case "distinct_clause":
      return buildDistinctClause(node, buildAST);
    case "count_clause":
      return buildCountClause(node);
    case "top_clause":
      return buildTopClause(node);
    case "search_clause":
      return buildSearchClause(node, buildAST);
    case "column_assignment":
      return buildColumnAssignment(node, buildAST);
    case "conditional_expression":
      return buildConditionalExpression(node, buildAST);
    case "function_call":
      return buildFunctionCall(node, buildAST);
    case "named_argument":
      return buildNamedArgument(node, buildAST);
    case "type_cast_expression":
      return buildTypeCastExpression(node, buildAST);
    case "binary_expression":
      return buildBinaryExpression(node, buildAST);
    case "comparison_expression":
      return buildComparisonExpression(node, buildAST);
    case "arithmetic_expression":
      return buildArithmeticExpression(node, buildAST);
    case "string_expression":
      return buildStringExpression(node);
    case "in_expression":
      return buildInExpression(node, buildAST);
    case "between_expression":
      return buildBetweenExpression(node, buildAST);
    case "parenthesized_expression":
      return buildParenthesizedExpression(node, buildAST);
    case "identifier":
      return buildIdentifier(node);
    case "qualified_identifier":
      return buildQualifiedIdentifier(node);
    case "string_literal":
      return buildStringLiteral(node);
    case "number_literal":
      return buildNumberLiteral(node);
    case "boolean_literal":
      return buildBooleanLiteral(node);
    case "null_literal":
      return buildNullLiteral(node);
    case "dynamic_literal":
      return buildDynamicLiteral(node);
    case "datetime_literal":
      return buildDatetimeLiteral(node);
    case "timespan_literal":
      return buildTimespanLiteral(node);
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
