import type {
    ParseResult,
    HighlightToken,
    TokenType,
    ParseError,
} from "@fossiq/kql-ast";
import { KqlParser } from "./parser";
import { KqlLexer } from "./lexer";

const parserInstance = new KqlParser();

/**
 * Map token names to TokenType for syntax highlighting
 */
function getTokenType(tokenName: string): TokenType | null {
    switch (tokenName) {
        case "Comment":
            return "comment";
        case "Identifier":
            return "identifier";
        case "NumberLiteral":
            return "number";
        case "StringLiteral":
        case "SingleStringLiteral":
            return "string";
        case "Let":
        case "Where":
            return "keyword";
        case "Plus":
        case "Minus":
        case "Multiply":
        case "Divide":
        case "Modulo":
        case "Equals":
        case "NotEquals":
        case "GreaterThan":
        case "LessThan":
        case "GreaterEqual":
        case "LessEqual":
        case "Pipe":
            return "operator";
        case "LParen":
        case "RParen":
        case "LBracket":
        case "RBracket":
        case "Comma":
        case "Semicolon":
            return "punctuation";
        default:
            return null;
    }
}

export function parseErrors(doc: string): ParseError[] {
    const lexResult = KqlLexer.tokenize(doc);
    parserInstance.input = lexResult.tokens;
    parserInstance.query();
    const errors: ParseError[] = [];

    // Lex errors
    for (const err of lexResult.errors) {
        errors.push({
            type: "ParseError",
            message: err.message,
            start: err.offset,
            end: err.offset + err.length,
        });
    }

    // Parse errors
    for (const err of parserInstance.errors) {
        errors.push({
            type: "ParseError",
            message: err.message,
            start: err.token.startOffset,
            end: err.token.endOffset || err.token.startOffset + 1,
        });
    }

    return errors;
}

/**
 * Extract highlight tokens from Chevrotain lex result for syntax highlighting
 */
export function extractHighlightTokens(doc: string): HighlightToken[] {
    const lexResult = KqlLexer.tokenize(doc);
    const tokens: HighlightToken[] = [];

    for (const token of lexResult.tokens) {
        const tokenType = getTokenType(token.tokenType.name);
        if (tokenType) {
            tokens.push({
                type: tokenType,
                start: token.startOffset,
                end: token.endOffset,
                value: token.image,
            });
        }
    }

    return tokens;
}

/**
 * Parse KQL and return both AST and highlight tokens
 */
export function parseKQL(doc: string): ParseResult {
    const lexResult = KqlLexer.tokenize(doc);
    parserInstance.input = lexResult.tokens;
    const cst = parserInstance.query();
    const errors = parseErrors(doc);
    const tokens = extractHighlightTokens(doc);

    // For now, no AST conversion
    const ast = undefined;

    return {
        ast,
        tokens,
        errors,
    };
}