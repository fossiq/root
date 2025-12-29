import {
  choice,
  raw,
  regex,
  type TokenDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Literal tokens for KQL grammar (identifiers, numbers, strings, etc.).
 *
 * This module defines literal tokens that represent actual values in KQL queries,
 * as opposed to operators and delimiters.
 */
export const literalTokens: TokenDef[] = [
  // Identifiers: letter or underscore, followed by zero or more letters/digits/underscores
  {
    name: "Identifier",
    pattern: regex(/[A-Za-z_][A-Za-z0-9_]*/),
  },

  // Numbers: integers or decimals
  // - [0-9]+ matches integer part
  // - (\.[0-9]+)? optionally matches decimal point and fractional part
  {
    name: "Number",
    pattern: regex(/[0-9]+(\.[0-9]+)?/),
  },

  // String literals - verbatim and standard strings
  // Supports verbatim, escaped, and obfuscated forms.
  {
    name: "String",
    pattern: choice(
      raw(String.raw`"@" "\"" !["]* "\""`),
      raw(String.raw`"@" "'" ![']* "'"`),
      raw(String.raw`"h" "\"" !["\n]* "\""`),
      raw(String.raw`"h" "@" "\"" !["]* "\""`),
      raw(String.raw`"\"" (!["\\] | "\\" _)* "\""`),
      raw(String.raw`"'" (!['\\] | "\\" _)* "'"`)
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
