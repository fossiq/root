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
 * - $[...] for character classes (e.g. $[0-9], $[a-zA-Z])
 * - ![] for negated character classes
 * - + * ? for repetition
 *
 * Note: @digit and @asciiLetter are NOT valid in lezer-generator CLI; use $[0-9] and $[a-zA-Z].
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

  // Step 3: Convert common character classes to Lezer $[...] syntax
  // Must do [0-9] before \d to avoid double-converting \d→$[0-9]→$$[0-9]
  result = result.replace(/\[0-9\]/g, "$[0-9]");
  result = result.replace(/\\d/g, "$[0-9]");
  result = result.replace(/\[a-zA-Z\]/g, "$[a-zA-Z]");

  // Step 4: Handle negated character classes
  // [^...] -> ![...]
  result = result.replace(/\[\^([^\]]+)\]/g, "![$1]");

  // Step 5: Wrap remaining character classes in Lezer's $[...] syntax
  // Skip already negated ones (lookbehind for !) and already-converted ones (lookbehind for $)
  result = result.replace(/(?<![$!])\[([^\]]+)\]/g, "$[$1]");

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
      const parts = expr.elements.map((e) => {
        const s = serializeExpr(e, depth + 1, limit);
        return e.type === "choice" ? "(" + s + ")" : s;
      });
      return parts.join(" ");
    }
    case "choice": {
      const parts = expr.alternatives.map((e) =>
        serializeExpr(e, depth + 1, limit)
      );
      return parts.join(" | ");
    }
    case "repeat": {
      const inner = serializeExpr(expr.expr, depth + 1, limit);
      const needsParens = expr.expr.type === "seq" || expr.expr.type === "choice";
      return (needsParens ? "(" + inner + ")" : inner) + expr.kind;
    }
    case "optional": {
      const inner = serializeExpr(expr.expr, depth + 1, limit);
      const needsParens = expr.expr.type === "seq" || expr.expr.type === "choice";
      return (needsParens ? "(" + inner + ")" : inner) + "?";
    }
    case "group":
      return "(" + serializeExpr(expr.expr, depth + 1, limit) + ")";
    default: {
      const neverExpr: never = expr;
      throw new Error(`Unknown pattern type: ${String(neverExpr)}`);
    }
  }
}
