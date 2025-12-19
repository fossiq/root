import { regex, type TokenDef } from "@fossiq/lezer-grammar-generator";

/**
 * Literal tokens for KQL grammar (identifiers, numbers, strings, etc.).
 */
export const literalTokens: TokenDef[] = [
    // Identifiers: letter or underscore, followed by zero or more letters/digits/underscores
    {
        name: "Identifier",
        pattern: regex(/[A-Za-z_][A-Za-z0-9_]*/),
    },

    // Numbers: digits optionally followed by decimal point and more digits
    {
        name: "Number",
        pattern: regex(/[0-9]+(\.[0-9]+)?/),
    },

    // String literals - verbatim and standard strings
    {
        name: "String",
        pattern: regex(
            /@"[^"]*"|@'[^']*'|h"[^"\n]*"|h@"[^"]*"|"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
        ),
    },

    // DateTime literal: (datetime|date)(...)
    {
        name: "DateTimeLiteral",
        pattern: regex(/(datetime|date)\([^)]*\)/),
    },

    // Timespan: number with time unit suffix
    {
        name: "Timespan",
        pattern: regex(/[0-9]+(\.[0-9]+)?(d|h|m|s|ms|microsecond|tick)+/),
    },

    // GUID literal: guid(hex-hex-hex-hex-hex)
    {
        name: "GuidLiteral",
        pattern: regex(/guid\([0-9a-fA-F-]+\)/),
    },
];
