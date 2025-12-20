import type { ValidationIssue } from "../model.js";

const RESERVED_NAMES = new Set(["@tokens", "@precedence", "@top"]);

/** Check for naming conflicts between different symbol types. */
export function checkNameConflicts(
  globalTokens: Set<string>,
  localTokens: Set<string>,
  rules: Set<string>,
  _externals: Set<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const name of globalTokens) {
    if (RESERVED_NAMES.has(name)) {
      issues.push(
        issue(
          "token.reservedName",
          `Token name '${name}' is reserved.`,
          `tokens.${name}`,
          "error",
        ),
      );
    }
    if (rules.has(name)) {
      issues.push(
        issue(
          "name.duplicate",
          `Name '${name}' is used by both a token and a rule.`,
          `tokens.${name}`,
          "error",
        ),
      );
    }
    if (localTokens.has(name)) {
      issues.push(
        issue(
          "name.duplicate",
          `Name '${name}' is used by both a global and local token.`,
          `tokens.${name}`,
          "error",
        ),
      );
    }
  }

  for (const name of localTokens) {
    if (RESERVED_NAMES.has(name)) {
      issues.push(
        issue(
          "token.reservedName",
          `Local token name '${name}' is reserved.`,
          `localTokens.${name}`,
          "error",
        ),
      );
    }
    if (rules.has(name)) {
      issues.push(
        issue(
          "name.duplicate",
          `Name '${name}' is used by both a local token and a rule.`,
          `localTokens.${name}`,
          "error",
        ),
      );
    }
  }

  return issues;
}

function issue(
  code: string,
  message: string,
  path: string | undefined,
  level: "error" | "warning",
): ValidationIssue {
  return { code, message, path, level };
}
