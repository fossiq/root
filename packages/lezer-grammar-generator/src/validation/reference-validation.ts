import type {
  PatternExpression,
  ValidationIssue,
  ValidationErrorCode,
  RuleDef,
} from "../model.js";

/** Validate references in expressions against the symbol table. */
export function validateReferences(
  rules: Record<string, RuleDef>,
  symbolTable: Set<string>,
  ruleParams: Map<string, readonly string[]>,
  ruleNames: Set<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [name, rule] of Object.entries(rules)) {
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
      if (ruleNames.has(expr.name)) {
        // refs will be used for cycles
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
  }

  return issues;
}

/** Validate global skip references. */
export function validateGlobalSkip(
  skip: PatternExpression | undefined,
  symbolTable: Set<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (skip) {
    walkExpressions(skip, (expr) => {
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

  return issues;
}

/** Find cycles in rule references and check reachability. */
export function validateCyclesAndReachability(
  rules: Record<string, RuleDef>,
  top: string | undefined,
  ruleNames: Set<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const references = new Map<string, Set<string>>();

  for (const [name, rule] of Object.entries(rules)) {
    const refs = new Set<string>();
    walkExpressions(rule.expression, (expr) => {
      if (expr.type !== "ref") return;
      if (ruleNames.has(expr.name)) {
        refs.add(expr.name);
      }
    });
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

  if (top) {
    const reachable = new Set<string>();
    traverse(top, references, reachable);
    for (const name of ruleNames) {
      if (name === top) continue;
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

  return issues;
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

function issue(
  code: ValidationErrorCode,
  message: string,
  path: string | undefined,
  level: "error" | "warning",
): ValidationIssue {
  return { code, message, path, level };
}
