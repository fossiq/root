import {
  generateGrammar,
  p,
  literal,
} from "../../lezer-grammar-generator/src/index.ts";
import { writeFileSync } from "fs";
import { join } from "path";

const config = {
  grammarName: "Query",
  astTypes: {
    // Top-level
    statement: {
      grammarName: "statement",
      grammarFields: "pipelineExpression | letStatement statement?",
      isRule: true,
    },
    letStatement: {
      grammarName: "letStatement",
      grammarFields: 'kw<"let"> identifier Equals expression Semicolon',
      isRule: true,
    },
    pipelineExpression: {
      grammarName: "pipelineExpression",
      grammarFields:
        "(tableExpression | unionClause | searchClause) (Pipe operator)*",
      isRule: true,
    },
    tableExpression: {
      grammarName: "tableExpression",
      grammarFields: "identifier | parenthesizedTableExpression",
      isRule: true,
    },
    parenthesizedTableExpression: {
      grammarName: "parenthesizedTableExpression",
      grammarFields: "OpenParen pipelineExpression CloseParen",
      isRule: true,
    },
    identifier: {
      grammarName: "identifier",
      grammarFields: "Identifier | bracketedIdentifier",
      isRule: true,
    },
    bracketedIdentifier: {
      grammarName: "bracketedIdentifier",
      grammarFields: "OpenBracket String CloseBracket",
      isRule: true,
    },
    // Operator
    operator: {
      grammarName: "operator",
      grammarFields: `whereClause | projectClause | projectAwayClause | projectKeepClause | projectRenameClause | projectReorderClause | extendClause | sortClause | limitClause | takeClause | topClause | distinctClause | summarizeClause | joinClause | unionClause | searchClause | identifier | Number | String`,
      isRule: true,
    },
    // Clauses
    joinClause: {
      grammarName: "joinClause",
      grammarFields: 'kw<"join"> joinKind? tableExpression kw<"on"> expression',
      isRule: true,
    },
    unionClause: {
      grammarName: "unionClause",
      grammarFields:
        'kw<"union"> (kw<"kind"> Equals identifier)? (kw<"withsource"> Equals identifier)? (tableExpression (Comma tableExpression)*)',
      isRule: true,
    },
    searchClause: {
      grammarName: "searchClause",
      grammarFields:
        'kw<"search"> (kw<"kind"> Equals identifier)? (kw<"in"> OpenParen tableExpression (Comma tableExpression)* CloseParen)? expression',
      isRule: true,
    },
    projectClause: {
      grammarName: "projectClause",
      grammarFields: 'kw<"project"> columnList',
      isRule: true,
    },
    projectAwayClause: {
      grammarName: "projectAwayClause",
      grammarFields: '(ProjectAway | kw<"projectaway">) columnList',
      isRule: true,
    },
    projectKeepClause: {
      grammarName: "projectKeepClause",
      grammarFields: '(ProjectKeep | kw<"projectkeep">) columnList',
      isRule: true,
    },
    projectRenameClause: {
      grammarName: "projectRenameClause",
      grammarFields: '(ProjectRename | kw<"projectrename">) columnList',
      isRule: true,
    },
    projectReorderClause: {
      grammarName: "projectReorderClause",
      grammarFields: '(ProjectReorder | kw<"projectreorder">) columnList',
      isRule: true,
    },
    extendClause: {
      grammarName: "extendClause",
      grammarFields: 'kw<"extend"> columnList',
      isRule: true,
    },
    sortClause: {
      grammarName: "sortClause",
      grammarFields: 'kw<"sort"> kw<"by">? sortColumnList',
      isRule: true,
    },
    limitClause: {
      grammarName: "limitClause",
      grammarFields: 'kw<"limit"> Number',
      isRule: true,
    },
    takeClause: {
      grammarName: "takeClause",
      grammarFields: 'kw<"take"> Number',
      isRule: true,
    },
    topClause: {
      grammarName: "topClause",
      grammarFields:
        'kw<"top"> Number kw<"by">? identifier (kw<"asc"> | kw<"desc">)?',
      isRule: true,
    },
    distinctClause: {
      grammarName: "distinctClause",
      grammarFields: 'kw<"distinct"> columnNameList',
      isRule: true,
    },
    summarizeClause: {
      grammarName: "summarizeClause",
      grammarFields:
        'kw<"summarize"> aggregationList (kw<"by"> columnNameList)?',
      isRule: true,
    },
    whereClause: {
      grammarName: "whereClause",
      grammarFields: 'kw<"where"> expression',
      isRule: true,
    },

    // Lists and sub-structures
    sortColumnList: {
      grammarName: "sortColumnList",
      grammarFields: "sortColumn (Comma sortColumn)*",
      isRule: true,
    },
    sortColumn: {
      grammarName: "sortColumn",
      grammarFields: 'identifier (kw<"asc"> | kw<"desc">)?',
      isRule: true,
    },
    columnNameList: {
      grammarName: "columnNameList",
      grammarFields: "identifier (Comma identifier)*",
      isRule: true,
    },
    aggregationList: {
      grammarName: "aggregationList",
      grammarFields: "aggregation (Comma aggregation)*",
      isRule: true,
    },
    aggregation: {
      grammarName: "aggregation",
      grammarFields: "identifier Equals aggregateFunction | aggregateFunction",
      isRule: true,
    },
    aggregateFunction: {
      grammarName: "aggregateFunction",
      grammarFields: "functionName OpenParen argumentList? CloseParen",
      isRule: true,
    },
    functionName: {
      grammarName: "functionName",
      grammarFields: "identifier",
      isRule: true,
    },
    argumentList: {
      grammarName: "argumentList",
      grammarFields: "expression (Comma expression)*",
      isRule: true,
    },
    joinKind: {
      grammarName: "joinKind",
      grammarFields:
        'kw<"inner"> | kw<"leftouter"> | kw<"rightouter"> | kw<"fullouter"> | kw<"leftanti"> | kw<"rightanti"> | kw<"leftsemi"> | kw<"rightsemi">',
      isRule: true,
    },
    columnList: {
      grammarName: "columnList",
      grammarFields: "columnSpec (Comma columnSpec)*",
      isRule: true,
    },
    columnSpec: {
      grammarName: "columnSpec",
      grammarFields: "identifier (Equals expression)?",
      isRule: true,
    },

    // Expressions
    expression: {
      grammarName: "expression",
      grammarFields: "orExpression",
      isRule: true,
    },
    orExpression: {
      grammarName: "orExpression",
      grammarFields: 'andExpression (kw<"or"> andExpression)*',
      isRule: true,
    },
    andExpression: {
      grammarName: "andExpression",
      grammarFields: 'notExpression (kw<"and"> notExpression)*',
      isRule: true,
    },
    notExpression: {
      grammarName: "notExpression",
      grammarFields: 'kw<"not"> notExpression | comparisonExpression',
      isRule: true,
    },
    comparisonExpression: {
      grammarName: "comparisonExpression",
      grammarFields:
        'sumExpression ((comparisonOperator sumExpression) | ((kw<"between"> | kwRenamed<"!between", "NotBetween">) OpenParen sumExpression RangeDoubleDot sumExpression CloseParen))*',
      isRule: true,
    },
    sumExpression: {
      grammarName: "sumExpression",
      grammarFields: "termExpression ((Plus | Minus) termExpression)*",
      isRule: true,
    },
    termExpression: {
      grammarName: "termExpression",
      grammarFields:
        "unaryExpression ((Star | Slash | Percent) unaryExpression)*",
      isRule: true,
    },
    unaryExpression: {
      grammarName: "unaryExpression",
      grammarFields: "Minus unaryExpression | primaryExpression",
      isRule: true,
    },

    primaryExpression: {
      grammarName: "primaryExpression",
      grammarFields:
        "functionCall | OpenParen expression CloseParen | literal | columnReference",
      isRule: true,
    },
    columnReference: {
      grammarName: "columnReference",
      grammarFields: "identifier (OpenBracket expression CloseBracket)*",
      isRule: true,
    },
    functionCall: {
      grammarName: "functionCall",
      grammarFields: "functionName OpenParen argumentList? CloseParen",
      isRule: true,
    },

    comparisonOperator: {
      grammarName: "comparisonOperator",
      grammarFields:
        'ComparisonOp | kw<"contains"> | kwRenamed<"!contains", "NotContains"> | kw<"startswith"> | kw<"endswith"> | kw<"has"> | kwRenamed<"!has", "NotHas"> | kw<"in"> | kwRenamed<"!in", "NotIn">',
      isRule: true,
    },

    literal: {
      grammarName: "literal",
      grammarFields:
        "Number | String | Timespan | DateTimeLiteral | GuidLiteral",
      isRule: true,
    },
  },
  // Custom tokens
  tokens: [
    { name: "ProjectAway", pattern: literal("project-away") },
    { name: "ProjectKeep", pattern: literal("project-keep") },
    { name: "ProjectRename", pattern: literal("project-rename") },
    { name: "ProjectReorder", pattern: literal("project-reorder") },
    { name: "RangeDoubleDot", pattern: literal("..") },
    {
      name: "Timespan",
      pattern:
        '(@digit+ ("." @digit+)? ("d" | "h" | "m" | "s" | "ms" | "microsecond" | "tick"))+',
    },
    {
      name: "DateTimeLiteral",
      pattern: p`("datetime" | "date") "(" $[ \t\n\r]* $[0-9]+ "-" $[0-9]+ "-" $[0-9]+ (("T" | " ") $[0-9]+ ":" $[0-9]+ ":" $[0-9]+ ("." $[0-9]+)? "Z"?)? $[ \t\n\r]* ")"`,
    },
    {
      name: "GuidLiteral",
      pattern: p`"guid(" $[ \t\n\r]* $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ $[ \t\n\r]* ")"`,
    },
    {
      name: "String",
      pattern: p`
    // Verbatim double quoted: @"C:\path\file.txt" (no escapes)
    '@"' (!["\n])* '"' |
    // Verbatim single quoted: @'no escapes \t'
    "@'" (!['])* "'" |
    // Obfuscated double quoted: h"secret"
    'h"' (!["\n])* '"' |
    // Obfuscated verbatim double quoted: h@"verbatim secret"
    'h@"' (!["\n])* '"' |
    // Standard double quoted
    '"' (![\"])* '"' |
    // Standard single quoted
    "'" (!['])* "'"
      `,
    },
  ],
  // Precedence list for tokens
  precedence: [
    "LineComment",
    "Slash",
    "ProjectAway",
    "ProjectKeep",
    "ProjectRename",
    "ProjectReorder",
    "RangeDoubleDot",
    "Timespan",
    "DateTimeLiteral",
    "GuidLiteral",
    "Number",
    "String",
    "Identifier",
  ],
  macros: {
    "kwRenamed<term, name>": "@specialize[@name={name}]<Identifier, term>",
    "kw<term>": "@specialize[@name={term}]<Identifier, term>",
  },
};
const result = generateGrammar(config);

if (result.errors.length > 0) {
  console.error("Errors generating grammar:", result.errors);
  process.exit(1);
}

writeFileSync(join(process.cwd(), "src/kql.grammar"), result.grammar);
console.log("Generated src/kql.grammar");
