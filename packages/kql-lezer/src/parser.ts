import { CstParser } from "chevrotain";
import {
  Let,
  Where,
  Plus,
  Minus,
  Multiply,
  Divide,
  Modulo,
  Equals,
  NotEquals,
  GreaterThan,
  LessThan,
  GreaterEqual,
  LessEqual,
  Identifier,
  NumberLiteral,
  StringLiteral,
  SingleStringLiteral,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Comma,
  Semicolon,
  Pipe,
  allTokens
} from "./lexer.js";

export class KqlParser extends CstParser {
  constructor() {
    super(allTokens);

    // Rules
    this.query = this.RULE("query", () => {
      this.MANY(() => this.SUBRULE(this.letStatement));
      this.SUBRULE(this.pipelineExpression);
    });

    this.letStatement = this.RULE("letStatement", () => {
      this.CONSUME(Let);
      this.CONSUME(Identifier);
      this.CONSUME(Equals);
      this.SUBRULE(this.expression);
      this.CONSUME(Semicolon);
    });

    this.pipelineExpression = this.RULE("pipelineExpression", () => {
      this.SUBRULE(this.tableExpression);
      this.CONSUME(Pipe);
      this.SUBRULE(this.whereClause);
    });

    this.tableExpression = this.RULE("tableExpression", () => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        {
          ALT: () => {
            this.CONSUME(LParen);
            this.SUBRULE(this.pipelineExpression);
            this.CONSUME(RParen);
          }
        }
      ]);
    });

    this.whereClause = this.RULE("whereClause", () => {
      this.CONSUME(Where);
      this.SUBRULE(this.expression);
    });

    this.expression = this.RULE("expression", () => {
      this.SUBRULE(this.additiveExpression);
    });

    this.additiveExpression = this.RULE("additiveExpression", () => {
      this.SUBRULE(this.multiplicativeExpression);
      this.MANY(() => {
        this.OR([
          { ALT: () => this.CONSUME(Plus) },
          { ALT: () => this.CONSUME(Minus) }
        ]);
        this.SUBRULE2(this.multiplicativeExpression);
      });
    });

    this.multiplicativeExpression = this.RULE("multiplicativeExpression", () => {
      this.SUBRULE(this.primaryExpression);
      this.MANY(() => {
        this.OR([
          { ALT: () => this.CONSUME(Multiply) },
          { ALT: () => this.CONSUME(Divide) },
          { ALT: () => this.CONSUME(Modulo) }
        ]);
        this.SUBRULE2(this.primaryExpression);
      });
    });

    this.primaryExpression = this.RULE("primaryExpression", () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(LParen);
            this.SUBRULE(this.expression);
            this.CONSUME(RParen);
          }
        },
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(NumberLiteral) },
        { ALT: () => this.CONSUME(StringLiteral) },
        { ALT: () => this.CONSUME(SingleStringLiteral) }
      ]);
    });

    this.performSelfAnalysis();
  }

  // Rule properties
  query: any;
  letStatement: any;
  pipelineExpression: any;
  tableExpression: any;
  whereClause: any;
  expression: any;
  additiveExpression: any;
  multiplicativeExpression: any;
  primaryExpression: any;
}