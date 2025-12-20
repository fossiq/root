import type { ValidationIssue, ValidationErrorCode } from "../model.js";

interface NameValidationResult {
  names: Set<string>;
  issues: ValidationIssue[];
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Validate external token declarations. */
export function validateExternals(
  externals: readonly string[],
  globalTokenNames: Set<string>,
  localTokenNames: Set<string>,
  ruleNames: Set<string>,
): NameValidationResult {
  const issues: ValidationIssue[] = [];
  const names = new Set<string>();
  const counts = new Map<string, number>();

  for (const name of externals) {
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  for (const [name, count] of counts) {
    if (count > 1) {
      issues.push(
        issue(
          "external.duplicate",
          `Duplicate external name '${name}'.`,
          `externals.${name}`,
          "error",
        ),
      );
    }
  }

  for (const name of externals) {
    if (!isIdentifier(name)) {
      issues.push(
        issue(
          "external.invalidName",
          `Invalid external name '${name}'.`,
          `externals.${name}`,
          "error",
        ),
      );
    }
    if (
      ruleNames.has(name) ||
      globalTokenNames.has(name) ||
      localTokenNames.has(name)
    ) {
      issues.push(
        issue(
          "external.duplicate",
          `External name '${name}' conflicts with a rule or token.`,
          `externals.${name}`,
          "error",
        ),
      );
    }
    names.add(name);
  }

  return { names, issues };
}

function issue(
  code: ValidationErrorCode,
  message: string,
  path: string | undefined,
  level: "error" | "warning",
): ValidationIssue {
  return { code, message, path, level };
}

function isIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name);
}
