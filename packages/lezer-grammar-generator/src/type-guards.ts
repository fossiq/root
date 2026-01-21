/**
 * Type guard functions for runtime validation
 */

import type { ASTTypeDefinition } from "./types.js";

/**
 * Type guard to check if a string is a valid identifier
 */
export function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/**
 * Type guard to check if an object is an ASTTypeDefinition
 */
export function isASTTypeDefinition(obj: unknown): obj is ASTTypeDefinition {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const record = obj as Record<string, unknown>;
  return (
    typeof record.grammarName === "string" &&
    typeof record.grammarFields === "string"
  );
}
