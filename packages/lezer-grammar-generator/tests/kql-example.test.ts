import { describe, expect, test } from "bun:test";
import { generateGrammar } from "../src/generator.js";
import type { GrammarGeneratorConfig } from "../src/types.js";

describe("KQL grammar generation", () => {
  test("generates KQL-like grammar", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "Query",
      astTypes: {
        statement: {
          grammarName: "statement",
          grammarFields: "pipelineExpression | letStatement statement?",
          isRule: true
        },
        letStatement: {
          grammarName: "letStatement",
          grammarFields: 'kw<"let"> identifier Equals expression Semicolon',
          isRule: true
        },
        pipelineExpression: {
          grammarName: "pipelineExpression",
          grammarFields: "tableExpression (Pipe operator)*",
          isRule: true
        },
        tableExpression: {
          grammarName: "tableExpression",
          grammarFields: "identifier",
          isRule: true
        },
        identifier: {
          grammarName: "identifier",
          grammarFields: "Identifier | bracketedIdentifier",
          isRule: true
        },
        bracketedIdentifier: {
          grammarName: "bracketedIdentifier",
          grammarFields: "OpenBracket String CloseBracket",
          isRule: true
        },
        operator: {
          grammarName: "operator",
          grammarFields: "whereClause | projectClause | extendClause | sortClause | limitClause | takeClause | topClause | distinctClause | summarizeClause | joinClause | identifier | Number | String",
          isRule: true
        },
        whereClause: {
          grammarName: "whereClause",
          grammarFields: 'kw<"where"> expression',
          isRule: true
        },
        projectClause: {
          grammarName: "projectClause",
          grammarFields: 'kw<"project"> columnList',
          isRule: true
        },
        extendClause: {
          grammarName: "extendClause",
          grammarFields: 'kw<"extend"> columnList',
          isRule: true
        },
        sortClause: {
          grammarName: "sortClause",
          grammarFields: 'kw<"sort"> kw<"by">? sortColumnList',
          isRule: true
        },
        limitClause: {
          grammarName: "limitClause",
          grammarFields: 'kw<"limit"> Number',
          isRule: true
        },
        takeClause: {
          grammarName: "takeClause",
          grammarFields: 'kw<"take"> Number',
          isRule: true
        },
        topClause: {
          grammarName: "topClause",
          grammarFields: 'kw<"top"> Number kw<"by">? identifier (kw<"asc"> | kw<"desc">)?',
          isRule: true
        },
        distinctClause: {
          grammarName: "distinctClause",
          grammarFields: 'kw<"distinct"> columnNameList',
          isRule: true
        },
        summarizeClause: {
          grammarName: "summarizeClause",
          grammarFields: 'kw<"summarize"> aggregationList (kw<"by"> columnNameList)?',
          isRule: true
        },
        joinClause: {
          grammarName: "joinClause",
          grammarFields: 'kw<"join"> joinKind? tableExpression kw<"on"> expression',
          isRule: true
        },
        joinKind: {
          grammarName: "joinKind",
          grammarFields: 'kw<"inner"> | kw<"leftouter"> | kw<"rightouter"> | kw<"fullouter"> | kw<"leftanti"> | kw<"rightanti"> | kw<"leftsemi"> | kw<"rightsemi">',
          isRule: true
        },
        columnList: {
          grammarName: "columnList",
          grammarFields: "columnSpec (Comma columnSpec)*",
          isRule: true
        },
        columnSpec: {
          grammarName: "columnSpec",
          grammarFields: "identifier (Equals expression)?",
          isRule: true
        },
        sortColumnList: {
          grammarName: "sortColumnList",
          grammarFields: "sortColumn (Comma sortColumn)*",
          isRule: true
        },
        sortColumn: {
          grammarName: "sortColumn",
          grammarFields: "identifier (kw<\"asc\"> | kw<\"desc\">)?",
          isRule: true
        },
        columnNameList: {
          grammarName: "columnNameList",
          grammarFields: "identifier (Comma identifier)*",
          isRule: true
        },
        aggregationList: {
          grammarName: "aggregationList",
          grammarFields: "aggregation (Comma aggregation)*",
          isRule: true
        },
        aggregation: {
          grammarName: "aggregation",
          grammarFields: "identifier Equals aggregateFunction | aggregateFunction",
          isRule: true
        },
        aggregateFunction: {
          grammarName: "aggregateFunction",
          grammarFields: "functionName OpenParen argumentList? CloseParen",
          isRule: true
        },
        functionName: {
          grammarName: "functionName",
          grammarFields: "identifier",
          isRule: true
        },
        argumentList: {
          grammarName: "argumentList",
          grammarFields: "expression (Comma expression)*",
          isRule: true
        },
        expression: {
          grammarName: "expression",
          grammarFields: "orExpression",
          isRule: true
        },
        orExpression: {
          grammarName: "orExpression",
          grammarFields: "andExpression (kw<\"or\"> andExpression)*",
          isRule: true,
          precedence: 1
        },
        andExpression: {
          grammarName: "andExpression",
          grammarFields: "notExpression (kw<\"and\"> notExpression)*",
          isRule: true,
          precedence: 2
        },
        notExpression: {
          grammarName: "notExpression",
          grammarFields: 'kw<"not"> notExpression | comparisonExpression',
          isRule: true,
          precedence: 3
        },
        comparisonExpression: {
          grammarName: "comparisonExpression",
          grammarFields: "sumExpression (comparisonOperator sumExpression)*",
          isRule: true,
          precedence: 4
        },
        sumExpression: {
          grammarName: "sumExpression",
          grammarFields: "termExpression ((Plus | Minus) termExpression)*",
          isRule: true,
          precedence: 5
        },
        termExpression: {
          grammarName: "termExpression",
          grammarFields: "unaryExpression ((Star | Slash | Percent) unaryExpression)*",
          isRule: true,
          precedence: 6
        },
        unaryExpression: {
          grammarName: "unaryExpression",
          grammarFields: "Minus unaryExpression | primaryExpression",
          isRule: true,
          precedence: 7
        },
        primaryExpression: {
          grammarName: "primaryExpression",
          grammarFields: "functionCall | OpenParen expression CloseParen | literal | columnReference",
          isRule: true
        },
        columnReference: {
          grammarName: "columnReference",
          grammarFields: "identifier (OpenBracket expression CloseBracket)*",
          isRule: true
        },
        functionCall: {
          grammarName: "functionCall",
          grammarFields: "functionName OpenParen argumentList? CloseParen",
          isRule: true
        },
        comparisonOperator: {
          grammarName: "comparisonOperator",
          grammarFields: "ComparisonOp | kw<\"contains\"> | kwRenamed<\"!contains\", \"NotContains\"> | kw<\"startswith\"> | kw<\"endswith\"> | kw<\"has\"> | kwRenamed<\"!has\", \"NotHas\"> | kw<\"in\"> | kwRenamed<\"!in\", \"NotIn\">",
          isRule: true
        },
        literal: {
          grammarName: "literal",
          grammarFields: "Number | String | Timespan | DateTimeLiteral | GuidLiteral",
          isRule: true
        }
      },
      tokens: [
        {
          name: "ProjectAway",
          pattern: '"project-away"'
        },
        {
          name: "ProjectKeep",
          pattern: '"project-keep"'
        },
        {
          name: "ProjectRename",
          pattern: '"project-rename"'
        },
        {
          name: "ProjectReorder",
          pattern: '"project-reorder"'
        },
        {
          name: "Timespan",
          pattern: '(@digit+ ("." @digit+)? ("d" | "h" | "m" | "s" | "ms" | "microsecond" | "tick"))+'
        },
        {
          name: "DateTimeLiteral",
          pattern: '("datetime" | "date") "(" $[ \t\n\r]* @digit+ "-" @digit+ "-" @digit+ (("T" | " ") @digit+ ":" @digit+ ":" @digit+ ("." @digit+)? "Z"?)? $[ \t\n\r]* ")"'
        },
        {
          name: "GuidLiteral",
          pattern: '"guid(" $[ \t\n\r]* $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ "-" $[0-9a-fA-F]+ $[ \t\n\r]* ")"'
        }
      ]
    };

    const result = generateGrammar(config);
    
    // Check some key parts
    expect(result.grammar).toContain("@top Query { statement }");
    expect(result.grammar).toContain('kw<"let"> identifier Equals expression Semicolon');
    expect(result.grammar).toContain("Timespan {");
    expect(result.grammar).toContain("@precedence {");
    expect(result.errors).toEqual([]);
    
    // Log a snippet for manual verification
    console.log("Generated grammar snippet:");
    console.log(result.grammar.split('\n').slice(0, 50).join('\n'));
  });
});