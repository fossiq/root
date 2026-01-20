import {
    type TokenDef,
    regex,
    literal,
    raw,
} from "@fossiq/lezer-grammar-generator";

/**
 * Core KQL tokens for Lezer grammar generation.
 * Definitions mirror the @tokens block in the reference .grammar.
 */
export const tokens: TokenDef[] = [
    // Delimiters
    { name: "Pipe", pattern: literal("|") },
    { name: "OpenParen", pattern: literal("(") },
    { name: "CloseParen", pattern: literal(")") },
    { name: "OpenBracket", pattern: literal("[") },
    { name: "CloseBracket", pattern: literal("]") },
    { name: "Comma", pattern: literal(",") },
    { name: "Semicolon", pattern: literal(";") },
    { name: "Equals", pattern: literal("=") },

    // Math operators
    { name: "Plus", pattern: literal("+") },
    { name: "Minus", pattern: literal("-") },
    { name: "Star", pattern: literal("*") },
    { name: "Slash", pattern: literal("/") },
    { name: "Percent", pattern: literal("%") },

    // Comparison operators
    { name: "ComparisonOp", pattern: literal("==") },
    { name: "ComparisonOp", pattern: literal("!=") },
    { name: "ComparisonOp", pattern: literal(">=") },
    { name: "ComparisonOp", pattern: literal("<=") },
    { name: "ComparisonOp", pattern: literal(">") },
    { name: "ComparisonOp", pattern: literal("<") },

    // Identifiers and numbers
    { name: "Identifier", pattern: regex("[A-Za-z_][A-Za-z0-9_]*") },
    { name: "Number", pattern: regex("[0-9]+(\\.[0-9]+)?") },

    // String literals (standard, verbatim, obfuscated)
    { name: "String", pattern: raw('@"[^"]*"') },
    { name: "String", pattern: raw("@'[^']*'") },
    { name: "String", pattern: raw('h"[^"\\n]*"') },
    { name: "String", pattern: raw('h@"[^"]*"') },
    { name: "String", pattern: raw('"([^"\\\\]|\\.)*"') },
    { name: "String", pattern: raw("'([^'\\\\]|\\.)*'") },
    // DateTime and Timespan literals
    { name: "DateTimeLiteral", pattern: regex("(?:datetime|date)\\([^)]*\\)") },
    {
        name: "Timespan",
        pattern: regex("[0-9]+(?:\\.[0-9]+)?(?:d|h|m|s|ms|microsecond|tick)+"),
    },

    // GUID literal
    { name: "GuidLiteral", pattern: regex("guid\\([0-9a-fA-F-]+\\)") },

    // Comments & whitespace
    { name: "LineComment", pattern: regex("//[^\\n]*") },
    { name: "whitespace", pattern: regex("[ \\t\\n\\r]+") },

    // Custom KQL keywords requiring specialization
    { name: "ProjectAway", pattern: literal("project-away") },
    { name: "ProjectKeep", pattern: literal("project-keep") },
    { name: "ProjectRename", pattern: literal("project-rename") },
    { name: "ProjectReorder", pattern: literal("project-reorder") },
    { name: "MvExpand", pattern: literal("mv-expand") },
    { name: "RangeDoubleDot", pattern: literal("..") },
    { name: "NotBetween", pattern: literal("!between") },
    { name: "NotContains", pattern: literal("!contains") },
    { name: "NotHas", pattern: literal("!has") },
    { name: "NotIn", pattern: literal("!in") },
];
