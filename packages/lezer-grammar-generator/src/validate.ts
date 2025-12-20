import type {
  GrammarDefinition,
  PatternExpression,
  TokenDef,
  ValidationIssue,
  ValidationResult,
} from "./model.js";

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED_NAMES = new Set(["@tokens", "@precedence", "@top"]);

interface NameValidationResult {
  names: Set<string>;
  issues: ValidationIssue[];
}

/** Validate a GrammarDefinition for shape and references. */
export function validateGrammar(def: GrammarDefinition): ValidationResult {
  const issues: ValidationIssue[] = [];

  const ruleNames = Object.keys(def.rules ?? {});
  if (ruleNames.length === 0) {
    issues.push(issue("rules.empty", "No rules defined.", "rules", "error"));
    return finalize(issues);
  }

  const declaredDialects = new Set(def.dialects ?? []);
  // Validate tokens
  const globalTokens = validateTokens(
    def.tokens ?? [],
    "tokens",
    declaredDialects,
  );
  issues.push(...globalTokens.issues);

  // Validate local tokens
  const localTokens = validateTokens(
    def.localTokens ?? [],
    "localTokens",
    declaredDialects,
  );
  issues.push(...localTokens.issues);

  // Validate rules
  const ruleValidation = validateRules(ruleNames, declaredDialects);
  issues.push(...ruleValidation.issues);

  // Validate externals
  const externals = validateExternals(
    def.externals ?? [],
    globalTokens.names,
    localTokens.names,
    ruleValidation.names,
  );
  issues.push(...externals.issues);

  // Check name conflicts
  issues.push(
    ...checkNameConflicts(
      globalTokens.names,
      localTokens.names,
      ruleValidation.names,
      externals.names,
    ),
  );

  if (def.top) {
    if (!ruleValidation.names.has(def.top)) {
      issues.push(
        issue(
          "top.unknown",
          `Top rule '${def.top}' is not defined.`,
          "top",
          "error",
        ),
      );
    }
    if (!def.name) {
      issues.push(
        issue(
          "top.missingName",
          "Grammar name is required when top is set.",
          "name",
          "error",
        ),
      );
    } else if (!isIdentifier(def.name)) {
      issues.push(
        issue(
          "name.invalid",
          `Invalid grammar name '${def.name}'.`,
          "name",
          "error",
        ),
      );
    }
  } else if (def.name && !isIdentifier(def.name)) {
    issues.push(
      issue(
        "name.invalid",
        `Invalid grammar name '${def.name}'.`,
        "name",
        "error",
      ),
    );
  }

  const symbolTable = new Set<string>([
    ...ruleValidation.names,
    ...globalTokens.names,
    ...localTokens.names,
    ...externals.names,
  ]);

  if (def.skip) {
    walkExpressions(def.skip, (expr) => {
      if (expr.type !== "ref") return;
      if (!symbolTable.has(expr.name)) {
        issues.push(
          issue(
            "skip.unknown",
            `Unknown reference '${expr.name}' in global skip.`,
            "skip",
            "error",
          ),
        );
      }
    });
  }

  // Collect rule parameters and validate dialects
  const ruleParams = new Map<string, readonly string[]>();
  for (const [name, rule] of Object.entries(def.rules)) {
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

  const references = new Map<string, Set<string>>();
  for (const [name, rule] of Object.entries(def.rules)) {
    const refs = new Set<string>();
    walkExpressions(rule.expression, (expr) => {
      if (expr.type !== "ref") return;
      if (!symbolTable.has(expr.name)) {
        issues.push(
          issue(
            "ref.unknown",
            `Unknown reference '${expr.name}' in rule '${name}'.`,
            `rules.${name}`,
            "error",
          ),
        );
      }
      if (ruleValidation.names.has(expr.name)) {
        refs.add(expr.name);
      }

      const expectedParams = ruleParams.get(expr.name);
      if (expr.args && expr.args.length > 0) {
        if (!expectedParams) {
          issues.push(
            issue(
              "ref.unexpectedArgs",
              `Reference '${expr.name}' does not take params.`,
              `rules.${name}`,
              "error",
            ),
          );
        } else if (expectedParams.length !== expr.args.length) {
          issues.push(
            issue(
              "ref.arity",
              `Reference '${expr.name}' expects ${expectedParams.length} args but got ${expr.args.length}.`,
              `rules.${name}`,
              "error",
            ),
          );
        }
      } else if (expectedParams && expectedParams.length > 0) {
        issues.push(
          issue(
            "ref.arity",
            `Reference '${expr.name}' expects ${expectedParams.length} args but got 0.`,
            `rules.${name}`,
            "error",
          ),
        );
      }
    });

    if (rule.skip) {
      walkExpressions(rule.skip, (expr) => {
        if (expr.type !== "ref") return;
        if (!symbolTable.has(expr.name)) {
          issues.push(
            issue(
              "skip.unknown",
              `Unknown reference '${expr.name}' in skip for rule '${name}'.`,
              `rules.${name}`,
              "error",
            ),
          );
        }
      });
    }

    references.set(name, refs);
  }

  const cycles = findCycles(references);
  for (const cycle of cycles) {
    issues.push(
      issue(
        "rules.cycle",
        `Cycle detected: ${cycle.join(" -> ")}.`,
        "rules",
        "warning",
      ),
    );
  }

  if (def.top) {
    const reachable = new Set<string>();
    traverse(def.top, references, reachable);
    for (const name of ruleValidation.names) {
      if (name === def.top) continue;
      if (!reachable.has(name)) {
        issues.push(
          issue(
            "rules.unused",
            `Rule '${name}' is unreachable from top.`,
            `rules.${name}`,
            "warning",
          ),
        );
      }
    }
  }

  return finalize(issues);
}

function issue(
  code: string,
  message: string,
  path: string | undefined,
  level: "error" | "warning",
): ValidationIssue {
  return { code, message, path, level };
}

function finalize(issues: ValidationIssue[]): ValidationResult {
  const ok = issues.every((item) => item.level !== "error");
  return { ok, issues };
}

function validateTokens(
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

function validateRules(
  ruleNames: string[],
  declaredDialects: Set<string>,
): NameValidationResult {
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

function validateExternals(
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

function checkNameConflicts(
  globalTokens: Set<string>,
  localTokens: Set<string>,
  rules: Set<string>,
  externals: Set<string>,
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

function isIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name);
}

function walkExpressions(
  root: PatternExpression,
  visit: (expr: PatternExpression) => void,
): void {
  const stack: PatternExpression[] = [root];
  while (stack.length > 0) {
    const expr = stack.pop()!;
    visit(expr);
    switch (expr.type) {
      case "seq":
        stack.push(...expr.elements);
        break;
      case "choice":
        stack.push(...expr.alternatives);
        break;
      case "repeat":
      case "optional":
      case "group":
        stack.push(expr.expr);
        break;
      case "ref":
      case "literal":
      case "regex":
      case "raw":
        break;
      default: {
        const neverExpr: never = expr;
        throw new Error(`Unknown pattern type: ${String(neverExpr)}`);
      }
    }
  }
}

function findCycles(references: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const visit = (node: string) => {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      if (idx >= 0) cycles.push([...stack.slice(idx), node]);
      return;
    }

    visiting.add(node);
    stack.push(node);
    for (const next of references.get(node) ?? []) {
      visit(next);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };

  for (const node of references.keys()) {
    visit(node);
  }

  return cycles;
}

function traverse(
  start: string,
  references: Map<string, Set<string>>,
  visited: Set<string>,
): void {
  const stack = [start];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of references.get(node) ?? []) {
      stack.push(next);
    }
  }
}
