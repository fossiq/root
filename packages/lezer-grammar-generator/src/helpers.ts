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
