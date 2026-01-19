import { createToken, Lexer } from "chevrotain";

// Keywords
export const Let = createToken({ name: "Let", pattern: /let/ });
export const Where = createToken({ name: "Where", pattern: /where/ });

// Operators
export const Plus = createToken({ name: "Plus", pattern: /\+/ });
export const Minus = createToken({ name: "Minus", pattern: /-/ });
export const Multiply = createToken({ name: "Multiply", pattern: /\*/ });
export const Divide = createToken({ name: "Divide", pattern: /\// });
export const Modulo = createToken({ name: "Modulo", pattern: /%/ });

// Comparison
export const Equals = createToken({ name: "Equals", pattern: /==/ });
export const NotEquals = createToken({ name: "NotEquals", pattern: /!=/ });
export const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });
export const LessThan = createToken({ name: "LessThan", pattern: /</ });
export const GreaterEqual = createToken({ name: "GreaterEqual", pattern: />=/ });
export const LessEqual = createToken({ name: "LessEqual", pattern: /<=/ });

// Literals
export const Identifier = createToken({ name: "Identifier", pattern: /[A-Za-z_][A-Za-z0-9_]*/ });
export const NumberLiteral = createToken({ name: "NumberLiteral", pattern: /\d+(\.\d+)?/ });
export const StringLiteral = createToken({ name: "StringLiteral", pattern: /"([^"\\]|\\.)*"/ });
export const SingleStringLiteral = createToken({ name: "SingleStringLiteral", pattern: /'([^'\\]|\\.)*'/ });

// Delimiters
export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const LBracket = createToken({ name: "LBracket", pattern: /\[/ });
export const RBracket = createToken({ name: "RBracket", pattern: /\]/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
export const Pipe = createToken({ name: "Pipe", pattern: /\|/ });

// Whitespace
export const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
});

// Comments
export const Comment = createToken({
  name: "Comment",
  pattern: /\/\/.*/,
  group: Lexer.SKIPPED
});

// All tokens
export const allTokens = [
  Whitespace,
  Comment,
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
  StringLiteral,
  SingleStringLiteral,
  Identifier,
  NumberLiteral,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Comma,
  Semicolon,
  Pipe
];

// Lexer instance
export const KqlLexer = new Lexer(allTokens);