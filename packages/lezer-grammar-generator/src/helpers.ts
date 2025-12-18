/**
 * Tag function for defining raw Lezer grammar patterns.
 * Functions exactly like String.raw, allowing you to write patterns
 * with single backslashes.
 *
 * Example:
 * ```ts
 * pattern: p`"\\"` // Outputs "\" in the grammar file
 * ```
 */
export const p = String.raw;

/**
 * Creates a quoted string literal pattern for Lezer.
 * Automatically handles escaping of quotes and special characters.
 *
 * Example:
 * ```ts
 * pattern: literal("project-away") // Outputs "project-away"
 * ```
 */
export function literal(s: string): string {
  return JSON.stringify(s);
}

function isWrappedInParens(s: string): boolean {
  const trimmed = s.trim();
  return trimmed.startsWith("(") && trimmed.endsWith(")");
}

function needsGrouping(s: string): boolean {
  return /[\s|]/.test(s.trim());
}

function maybeGroup(s: string): string {
  const trimmed = s.trim();
  if (trimmed.length === 0) return trimmed;
  if (isWrappedInParens(trimmed)) return trimmed;
  return needsGrouping(trimmed) ? `(${trimmed})` : trimmed;
}

/**
 * Join grammar fragments with spaces (like Lezer `seq(...)`).
 *
 * Example:
 * ```ts
 * seq("identifier", "Equals", "expression") // => "identifier Equals expression"
 * ```
 */
export function seq(
  ...parts: Array<string | null | undefined | false>
): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Join alternatives with ` | ` (like Lezer `choice(...)`).
 *
 * Example:
 * ```ts
 * choice("Number", "String") // => "Number | String"
 * ```
 */
export function choice(
  ...alts: Array<string | null | undefined | false>
): string {
  return alts.filter(Boolean).join(" | ");
}

/**
 * Wrap an expression in parentheses.
 */
export function group(expr: string): string {
  return `(${expr.trim()})`;
}

/**
 * Make an expression optional (`?`), grouping it when needed.
 */
export function opt(expr: string): string {
  return `${maybeGroup(expr)}?`;
}

/**
 * Repeat an expression zero-or-more times (`*`), grouping it when needed.
 */
export function many(expr: string): string {
  return `${maybeGroup(expr)}*`;
}

/**
 * Repeat an expression one-or-more times (`+`), grouping it when needed.
 */
export function many1(expr: string): string {
  return `${maybeGroup(expr)}+`;
}

/**
 * Generate a separated list pattern like `item (sep item)*` (or optional when `min` is 0).
 *
 * Examples:
 * ```ts
 * separatedList("identifier", "Comma")                 // => "identifier (Comma identifier)*"
 * separatedList("identifier", "Comma", { min: 0 })     // => "(identifier (Comma identifier)*)?"
 * ```
 */
export function separatedList(
  item: string,
  separator: string,
  opts: { min?: 0 | 1 } = {}
): string {
  const list = seq(item, many(seq(group(seq(separator, item)))));
  if (opts.min === 0) return opt(list);
  return list;
}

/**
 * Emit a `kw<"...">` macro invocation (requires a matching macro in your grammar).
 */
export function kw(term: string): string {
  return `kw<${literal(term)}>`;
}

/**
 * Emit a `kwRenamed<"...", "...">` macro invocation (requires a matching macro in your grammar).
 */
export function kwRenamed(term: string, name: string): string {
  return `kwRenamed<${literal(term)}, ${literal(name)}>`;
}
