import type { ValidationIssue, ValidationErrorCode } from "../model.js";

interface NameValidationResult {
  names: Set<string>;
  issues: ValidationIssue[];
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED_NAMES = new Set(["@tokens", "@precedence", "@top"]);

/** Validate rule names for validity and reserved names. */
export function validateRules(ruleNames: string[]): NameValidationResult {
  const issues: ValidationIssue[] = [];
  const names = new Set<string>();

  for (const name of ruleNames) {
    if (!isIdentifier(name)) {
      issues.push(
        issue(
          "rule.invalidName",
          `Invalid rule name '${name}'.`,
          `rules.${name}`,
          "error",
        ),
      );
    }
    if (RESERVED_NAMES.has(name)) {
      issues.push(
        issue(
          "rule.reservedName",
          `Rule name '${name}' is reserved.`,
          `rules.${name}`,
          "error",
        ),
      );
    }
    names.add(name);
  }

  return { names, issues };
}

/** Validate rule properties like dialects and collect parameters. */
export function validateRuleProperties(
  rules: Record<string, any>,
  declaredDialects: Set<string>,
): { ruleParams: Map<string, readonly string[]>; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const ruleParams = new Map<string, readonly string[]>();

  for (const [name, rule] of Object.entries(rules)) {
    if (rule.params && rule.params.length > 0) {
      ruleParams.set(name, rule.params);
    }
    if (rule.dialect && !declaredDialects.has(rule.dialect)) {
      issues.push(
        issue(
          "dialect.unknown",
          `Unknown dialect '${rule.dialect}' for rule '${name}'.`,
          `rules.${name}`,
          "error",
        ),
      );
    }
  }

  return { ruleParams, issues };
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
