import type { PatternExpression } from "./model.js";

/** Create a literal string pattern. */
export function literal(value: string): PatternExpression {
    return { type: "literal", value };
}

/**
 * Create a regex pattern (accepts a single pattern or multiple patterns).
 * When multiple patterns are provided, they are joined with `|` (choice) operator.
 */
export function regex(
  pattern: string | RegExp | readonly (string | RegExp)[],
): PatternExpression {
  return { type: "regex", pattern };
}

/** Reference a rule/token by name, optionally with args. */
export function ref(name: string, args?: readonly string[]): PatternExpression {
    if (args && args.length > 0) {
        return { type: "ref", name, args };
    }
    return { type: "ref", name };
}

/** Sequence a list of expressions with spaces. */
export function seq(...elements: PatternExpression[]): PatternExpression {
    return { type: "seq", elements };
}

/** Choose between alternatives with `|`. */
export function choice(
    ...alternatives: PatternExpression[]
): PatternExpression {
    return { type: "choice", alternatives };
}

/** Repeat an expression with `*` or `+`. */
export function repeat(
    expr: PatternExpression,
    kind: "*" | "+",
): PatternExpression {
    return { type: "repeat", kind, expr };
}

/** Optional expression (`?`). */
export function optional(expr: PatternExpression): PatternExpression {
    return { type: "optional", expr };
}

/** Group an expression in parentheses. */
export function group(expr: PatternExpression): PatternExpression {
    return { type: "group", expr };
}

/** Emit raw Lezer grammar content. */
export function raw(content: string): PatternExpression {
    return { type: "raw", content };
}

/** Repeat zero-or-more (`*`). */
export function many(expr: PatternExpression): PatternExpression {
    return repeat(expr, "*");
}

/** Repeat one-or-more (`+`). */
export function many1(expr: PatternExpression): PatternExpression {
    return repeat(expr, "+");
}

/** Optional helper alias. */
export function opt(expr: PatternExpression): PatternExpression {
    return optional(expr);
}

/** Separated list builder with optional minimum. */
export function separatedList(
    item: PatternExpression,
    separator: PatternExpression,
    opts: { min?: 0 | 1 } = {},
): PatternExpression {
    const tail = many(group(seq(separator, item)));
    const list = seq(item, tail);
    if (opts.min === 0) return optional(list);
    return list;
}

/** Macro helper for kw<"..."> usage via raw content. */
export function kw(term: string): PatternExpression {
    return raw(`kw<${JSON.stringify(term)}>`);
}

/** Macro helper for kwRenamed<"...", "..."> usage via raw content. */
export function kwRenamed(term: string, name: string): PatternExpression {
    return raw(`kwRenamed<${JSON.stringify(term)}, ${JSON.stringify(name)}>`);
}
