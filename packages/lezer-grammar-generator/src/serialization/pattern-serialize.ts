import type { PatternExpression } from "../model.js";

const DEFAULT_DEPTH_LIMIT = 1000;

function isEscaped(pattern: string, index: number): boolean {
  let backslashCount = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (pattern[i] !== "\\") break;
    backslashCount++;
  }
  return backslashCount % 2 === 1;
}

function replaceLiteralDotsOutsideCharClasses(pattern: string): string {
  let result = "";
  let inCharClass = false;

  for (let i = 0; i < pattern.length; ) {
    const char = pattern[i];

    if (char === "\\") {
      const next = pattern[i + 1];
      if (next === undefined) {
        result += "\\";
        break;
      }

      if (next === "." && !inCharClass) {
        result += '"."';
      } else {
        result += `\\${next}`;
      }

      i += 2;
      continue;
    }

    if (char === "[" && !isEscaped(pattern, i)) {
      inCharClass = true;
    } else if (char === "]" && inCharClass && !isEscaped(pattern, i)) {
      inCharClass = false;
    }

    result += char;
    i += 1;
  }

  return result;
}

/**
 * Convert a regex pattern to Lezer's native token syntax.
 *
 * Lezer uses:
 * - $[...] for character classes
 * - @digit for [0-9]
 * - @asciiLetter for [a-zA-Z]
 * - ![] for negated character classes
 * - + * ? for repetition
 *
 * This is a best-effort conversion for common patterns.
 */
export function convertRegexToLezer(pattern: string): string {
  let result = replaceLiteralDotsOutsideCharClasses(pattern);

  // Step 1: Handle special characters that need quoting
  // Quote escaped parentheses and braces to treat them as literals
  result = result.replace(/\\([(){}])/g, '"$1"');

  // Step 2: Simplify regex constructs
  // Remove non-capturing groups: (?:...) -> (...)
  result = result.replace(/\(\?:/g, "(");

  // Step 3: Convert common character classes to Lezer builtins
  // Must do \d before [0-9] to avoid double conversion
  result = result.replace(/\\d/g, "@digit");
  result = result.replace(/\[0-9\]/g, "@digit");
  result = result.replace(/\[a-zA-Z\]/g, "@asciiLetter");

  // Step 4: Handle negated character classes
  // [^...] -> ![...]
  result = result.replace(/\[\^([^\]]+)\]/g, "![$1]");

  // Step 5: Wrap remaining character classes in Lezer's $[...] syntax
  // Skip already negated ones (lookbehind for !)
  result = result.replace(/(?<!!)\[([^\]]+)\]/g, "$[$1]");

  return result;
}

function isMultiplePatterns(
  pattern: string | RegExp | readonly (string | RegExp)[]
): pattern is readonly (string | RegExp)[] {
  return Array.isArray(pattern);
}

/** Serialize a PatternExpression to Lezer grammar text. */
export function serializePattern(
  expr: PatternExpression,
  depthLimit = DEFAULT_DEPTH_LIMIT
): string {
  return serializeExpr(expr, 0, depthLimit);
}

function serializeExpr(
  expr: PatternExpression,
  depth: number,
  limit: number
): string {
  if (depth > limit) {
    throw new Error("Pattern expression exceeds depth limit.");
  }

  switch (expr.type) {
    case "literal":
      return JSON.stringify(expr.value);
    case "regex": {
      if (isMultiplePatterns(expr.pattern)) {
        // Multiple patterns: convert each and join with |
        const patterns = expr.pattern.map((p) => {
          const patternStr = typeof p === "string" ? p : p.source;
          return convertRegexToLezer(patternStr);
        });
        return patterns.join(" | ");
      } else {
        // Single pattern (string or RegExp)
        const pattern =
          typeof expr.pattern === "string" ? expr.pattern : expr.pattern.source;
        return convertRegexToLezer(pattern);
      }
    }
    case "raw":
      return expr.content;
    case "ref": {
      let result = expr.name;
      if (expr.args && expr.args.length > 0) {
        result += `<${expr.args.join(", ")}>`;
      }
      return result;
    }
    case "seq": {
      const parts = expr.elements.map((e) =>
        serializeExpr(e, depth + 1, limit)
      );
      return parts.join(" ");
    }
    case "choice": {
      const parts = expr.alternatives.map((e) =>
        serializeExpr(e, depth + 1, limit)
      );
      return parts.join(" | ");
    }
    case "repeat":
      return serializeExpr(expr.expr, depth + 1, limit) + expr.kind;
    case "optional":
      return serializeExpr(expr.expr, depth + 1, limit) + "?";
    case "group":
      return "(" + serializeExpr(expr.expr, depth + 1, limit) + ")";
    default: {
      const neverExpr: never = expr;
      throw new Error(`Unknown pattern type: ${String(neverExpr)}`);
    }
  }
}
