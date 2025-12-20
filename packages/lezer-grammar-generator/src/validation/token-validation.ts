import type { TokenDef, ValidationIssue } from "../model.js";

interface NameValidationResult {
  names: Set<string>;
  issues: ValidationIssue[];
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Validate a list of tokens, returning names and issues. */
export function validateTokens(
  tokens: readonly TokenDef[],
  prefix: string,
  declaredDialects: Set<string>,
): NameValidationResult {
  const issues: ValidationIssue[] = [];
  const names = new Set<string>();
  const counts = new Map<string, number>();

  for (const token of tokens) {
    counts.set(token.name, (counts.get(token.name) || 0) + 1);
    if (!isIdentifier(token.name)) {
      issues.push(
        issue(
          "token.invalidName",
          `Invalid ${prefix === "localTokens" ? "local " : ""}token name '${token.name}'.`,
          `${prefix}.${token.name}`,
          "error",
        ),
      );
      continue;
    }
    names.add(token.name);

    if (token.dialect && !declaredDialects.has(token.dialect)) {
      issues.push(
        issue(
          "dialect.unknown",
          `Unknown dialect '${token.dialect}' for ${prefix === "localTokens" ? "local " : ""}token '${token.name}'.`,
          `${prefix}.${token.name}`,
          "error",
        ),
      );
    }
  }

  for (const [name, count] of counts) {
    if (count > 1) {
      issues.push(
        issue(
          "token.duplicate",
          `Duplicate ${prefix === "localTokens" ? "local " : ""}token name '${name}'.`,
          `${prefix}.${name}`,
          "error",
        ),
      );
    }
  }

  return { names, issues };
}

function issue(
  code: string,
  message: string,
  path: string | undefined,
  level: "error" | "warning",
): ValidationIssue {
  return { code, message, path, level };
}

function isIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name);
}
