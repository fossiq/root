/**
 * Tag function for defining raw Lezer grammar patterns.
 * Functions exactly like String.raw, allowing you to write patterns
 * with single backslashes.
 */
export const p = String.raw;

/**
 * Creates a quoted string literal pattern for Lezer.
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
 * Join grammar fragments with spaces (legacy string API).
 */
export function seq(
  ...parts: Array<string | null | undefined | false>
): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Join alternatives with ` | ` (legacy string API).
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
 * Generate a separated list pattern like `item (sep item)*`.
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
 * Emit a `kw<"...">` macro invocation (requires a matching macro).
 */
export function kw(term: string): string {
  return `kw<${literal(term)}>`;
}

/**
 * Emit a `kwRenamed<"...", "...">` macro invocation.
 */
export function kwRenamed(term: string, name: string): string {
  return `kwRenamed<${literal(term)}, ${literal(name)}>`;
}
