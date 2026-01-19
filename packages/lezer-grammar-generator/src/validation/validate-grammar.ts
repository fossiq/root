import type {
  GrammarDefinition,
  ValidationIssue,
  ValidationErrorCode,
  ValidationResult,
} from "../model.js";
import { validateTokens } from "./token-validation.js";
import { validateRules, validateRuleProperties } from "./rule-validation.js";
import { validateExternals } from "./external-validation.js";
import { checkNameConflicts } from "./name-conflict-validation.js";
import {
  validateReferences,
  validateGlobalSkip,
  validateCyclesAndReachability,
} from "./reference-validation.js";

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
    declaredDialects
  );
  issues.push(...globalTokens.issues);

  // Validate local tokens
  const localTokens = validateTokens(
    def.localTokens ?? [],
    "localTokens",
    declaredDialects
  );
  issues.push(...localTokens.issues);

  if (def.tokenPrecedence && def.tokenPrecedence.length > 0) {
    const tokenNames = new Set(globalTokens.names);
    for (const tokenName of def.tokenPrecedence) {
      if (!tokenNames.has(tokenName)) {
        issues.push(
          issue(
            "config.tokenPrecedence.unknownToken",
            `\`tokenPrecedence\` references unknown token '${tokenName}'.`,
            "tokenPrecedence",
            "error"
          )
        );
      }
    }
  }

  // Validate rules
  const ruleValidation = validateRules(ruleNames);
  issues.push(...ruleValidation.issues);

  // Validate externals
  const externals = validateExternals(
    def.externals ?? [],
    globalTokens.names,
    localTokens.names,
    ruleValidation.names
  );
  issues.push(...externals.issues);

  // Check name conflicts
  issues.push(
    ...checkNameConflicts(
      globalTokens.names,
      localTokens.names,
      ruleValidation.names,
      externals.names
    )
  );

  if (def.top) {
    if (!ruleValidation.names.has(def.top)) {
      issues.push(
        issue(
          "top.unknown",
          `Top rule '${def.top}' is not defined.`,
          "top",
          "error"
        )
      );
    }
    if (!def.name) {
      issues.push(
        issue(
          "top.missingName",
          "Grammar name is required when top is set.",
          "name",
          "error"
        )
      );
    } else if (!isIdentifier(def.name)) {
      issues.push(
        issue(
          "name.invalid",
          `Invalid grammar name '${def.name}'.`,
          "name",
          "error"
        )
      );
    }
  } else if (def.name && !isIdentifier(def.name)) {
    issues.push(
      issue(
        "name.invalid",
        `Invalid grammar name '${def.name}'.`,
        "name",
        "error"
      )
    );
  }

  const symbolTable = new Set<string>([
    ...ruleValidation.names,
    ...globalTokens.names,
    ...localTokens.names,
    ...externals.names,
  ]);

  // Validate global skip
  issues.push(...validateGlobalSkip(def.skip, symbolTable));

  // Validate rule properties and get params
  const { ruleParams, issues: rulePropIssues } = validateRuleProperties(
    def.rules,
    declaredDialects
  );
  issues.push(...rulePropIssues);

  // Validate references
  issues.push(
    ...validateReferences(
      def.rules,
      symbolTable,
      ruleParams,
      ruleValidation.names
    )
  );

  // Validate cycles and reachability
  issues.push(
    ...validateCyclesAndReachability(def.rules, def.top, ruleValidation.names)
  );

  return finalize(issues);
}

function issue(
  code: ValidationErrorCode,
  message: string,
  path: string | undefined,
  level: "error" | "warning"
): ValidationIssue {
  return { code, message, path, level };
}

function finalize(issues: ValidationIssue[]): ValidationResult {
  const ok = issues.every((item) => item.level !== "error");
  return { ok, issues };
}

function isIdentifier(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}
