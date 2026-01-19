import { GrammarGeneratorConfig } from "../types.js";
import type { ValidationIssue } from "../model.js";
import { defaultTokenNames } from "./sections.js";

export function validateConfig(
  config: GrammarGeneratorConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validationMode = config.validation?.mode ?? "basic";
  const allowUnknown = new Set(config.validation?.allowUnknown ?? []);

  if (!config.grammarName || typeof config.grammarName !== "string") {
    issues.push({
      code: "config.grammarName.missing",
      message: "`grammarName` is required.",
      path: "grammarName",
      level: "error",
    });
  } else if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(config.grammarName)) {
    issues.push({
      code: "config.grammarName.invalid",
      message:
        "`grammarName` must be a valid identifier (letters, digits, underscore; cannot start with a digit).",
      path: "grammarName",
      level: "error",
    });
  }

  if (!config.astTypes || typeof config.astTypes !== "object") {
    issues.push({
      code: "config.astTypes.missing",
      message: "`astTypes` is required.",
      path: "astTypes",
      level: "error",
    });
    return issues;
  }

  const astTypeDefs = Object.values(config.astTypes);
  if (astTypeDefs.length === 0) {
    issues.push({
      code: "config.astTypes.empty",
      message: "`astTypes` must include at least one type definition.",
      path: "astTypes",
      level: "error",
    });
  }

  const ruleNameCounts = new Map<string, number>();
  let hasRule = false;

  for (const def of astTypeDefs) {
    if (!def.grammarName || typeof def.grammarName !== "string") {
      issues.push({
        code: "config.astTypes.grammarName.missing",
        message: "All `astTypes` entries must include `grammarName`.",
        path: "astTypes",
        level: "error",
      });
      continue;
    }
    if (!def.grammarFields || typeof def.grammarFields !== "string") {
      issues.push({
        code: "config.astTypes.grammarFields.missing",
        message: `Rule '${def.grammarName}': \`grammarFields\` must be a non-empty string.`,
        path: `astTypes.${def.grammarName}.grammarFields`,
        level: "error",
      });
    } else if (def.grammarFields.trim().length === 0) {
      issues.push({
        code: "config.astTypes.grammarFields.empty",
        message: `Rule '${def.grammarName}': \`grammarFields\` must be a non-empty string.`,
        path: `astTypes.${def.grammarName}.grammarFields`,
        level: "error",
      });
    } else if (validationMode !== "off") {
      validatePassthrough(
        `Rule '${def.grammarName}': grammarFields`,
        def.grammarFields,
        issues,
      );
    }

    ruleNameCounts.set(
      def.grammarName,
      (ruleNameCounts.get(def.grammarName) || 0) + 1,
    );
    if (def.isRule) hasRule = true;
  }

  for (const [name, count] of ruleNameCounts) {
    if (count > 1) {
      issues.push({
        code: "config.astTypes.duplicate",
        message: `Duplicate rule name '${name}' in \`astTypes\`.`,
        path: "astTypes",
        level: "error",
      });
    }
  }

  if (!hasRule) {
    issues.push({
      code: "config.astTypes.noRules",
      message:
        "No rules found: at least one `astTypes` entry must have `isRule: true`.",
      path: "astTypes",
      level: "error",
    });
  }

  const tokens = config.tokens || [];
  const tokenNameCounts = new Map<string, number>();
  for (const token of tokens) {
    tokenNameCounts.set(token.name, (tokenNameCounts.get(token.name) || 0) + 1);

    if (!token.name || typeof token.name !== "string") {
      issues.push({
        code: "config.tokens.name.missing",
        message: "All `tokens` entries must include `name`.",
        path: "tokens",
        level: "error",
      });
      continue;
    }
    if ("specialized" in token) {
      if (
        !token.specialized.base ||
        typeof token.specialized.base !== "string" ||
        !token.specialized.term ||
        typeof token.specialized.term !== "string"
      ) {
        issues.push({
          code: "config.tokens.specialized.invalid",
          message: `Token '${token.name}': \`specialized\` must include non-empty \`base\` and \`term\`.`,
          path: `tokens.${token.name}.specialized`,
          level: "error",
        });
      }
    } else {
      if (!token.pattern || typeof token.pattern !== "string") {
        issues.push({
          code: "config.tokens.pattern.missing",
          message: `Token '${token.name}': \`pattern\` must be a non-empty string.`,
          path: `tokens.${token.name}.pattern`,
          level: "error",
        });
      } else if (token.pattern.trim().length === 0) {
        issues.push({
          code: "config.tokens.pattern.empty",
          message: `Token '${token.name}': \`pattern\` must be a non-empty string.`,
          path: `tokens.${token.name}.pattern`,
          level: "error",
        });
      } else if (validationMode !== "off") {
        validateTokenPattern(
          `Token '${token.name}': pattern`,
          token.pattern,
          issues,
        );
      }
    }
  }

  for (const [name, count] of tokenNameCounts) {
    if (count > 1) {
      issues.push({
        code: "config.tokens.duplicate",
        message: `Duplicate token name '${name}' in \`tokens\`.`,
        path: "tokens",
        level: "error",
      });
    }
  }

  const availableTokens = new Set<string>([
    ...defaultTokenNames,
    ...tokens.map((t) => t.name),
  ]);

  for (const token of tokens) {
    if (
      "specialized" in token &&
      token.specialized.base &&
      !availableTokens.has(token.specialized.base)
    ) {
      issues.push({
        code: "config.tokens.specialized.unknownBase",
        message: `Token '${token.name}': specialized base '${token.specialized.base}' is not a known token.`,
        path: `tokens.${token.name}.specialized.base`,
        level: "error",
      });
    }
  }

  if (config.precedence) {
    for (const tokenName of config.precedence) {
      if (!availableTokens.has(tokenName)) {
        issues.push({
          code: "config.precedence.unknownToken",
          message: `\`precedence\` references unknown token '${tokenName}'.`,
          path: "precedence",
          level: "error",
        });
      }
    }
  }

  if (validationMode !== "off") {
    const macroNames = new Set<string>();
    for (const macroKey of Object.keys(config.macros ?? {})) {
      const baseName = macroKey.split("<", 1)[0]?.trim();
      if (baseName) macroNames.add(baseName);
    }

    for (const def of astTypeDefs) {
      if (!def.grammarName || typeof def.grammarName !== "string") continue;
      if (!def.grammarFields || typeof def.grammarFields !== "string") continue;
      validateMacroInvocations(
        `Rule '${def.grammarName}': grammarFields`,
        def.grammarFields,
        macroNames,
        issues,
      );
    }

    if (validationMode === "strict") {
      const ruleNames = new Set(
        astTypeDefs.map((d) => d.grammarName).filter(Boolean) as string[],
      );
      const known = new Set<string>([
        ...ruleNames,
        ...availableTokens,
        ...macroNames,
      ]);

      for (const def of astTypeDefs) {
        if (!def.grammarName || typeof def.grammarName !== "string") continue;
        if (!def.grammarFields || typeof def.grammarFields !== "string")
          continue;

        const refs = extractBareIdentifiers(def.grammarFields);
        for (const ref of refs) {
          if (ref === "_") continue;
          if (allowUnknown.has(ref)) continue;
          if (!known.has(ref)) {
            issues.push({
              code: "config.astTypes.unknownReference",
              message: `Rule '${def.grammarName}': grammarFields references unknown identifier '${ref}'.`,
              path: `astTypes.${def.grammarName}.grammarFields`,
              level: "error",
            });
          }
        }
      }
    }
  }

  return issues;
}

function validatePassthrough(
  label: string,
  input: string,
  issues: ValidationIssue[],
) {
  const problems = findBalanceProblems(input);
  for (const p of problems)
    issues.push({
      code: "config.passthrough.unbalanced",
      message: `${label}: ${p}`,
      level: "error",
    });

  const tokenBalanceProblems = findDelimiterTokenBalanceProblems(input);
  for (const p of tokenBalanceProblems)
    issues.push({
      code: "config.passthrough.tokenUnbalanced",
      message: `${label}: ${p}`,
      level: "error",
    });

  if (/\|\s*\|/.test(input)) {
    issues.push({
      code: "config.passthrough.emptyAlternative",
      message: `${label}: contains empty alternative ('||').`,
      level: "error",
    });
  }
}

function validateTokenPattern(
  label: string,
  input: string,
  issues: ValidationIssue[],
) {
  // Token patterns frequently contain quoted strings (and sometimes single-quoted
  // fragments) that we don't try to fully parse here. Keep checks limited to
  // delimiter-token balance and obvious empty alternatives.
  const tokenBalanceProblems = findDelimiterTokenBalanceProblems(input);
  for (const p of tokenBalanceProblems)
    issues.push({
      code: "config.tokenPattern.tokenUnbalanced",
      message: `${label}: ${p}`,
      level: "error",
    });

  if (/\|\s*\|/.test(input)) {
    issues.push({
      code: "config.tokenPattern.emptyAlternative",
      message: `${label}: contains empty alternative ('||').`,
      level: "error",
    });
  }
}

function validateMacroInvocations(
  label: string,
  input: string,
  macroNames: Set<string>,
  issues: ValidationIssue[],
) {
  const invocations = extractMacroInvocations(input);
  for (const name of invocations) {
    if (!macroNames.has(name)) {
      issues.push({
        code: "config.macros.undefined",
        message: `${label}: uses macro '${name}<...>' but no such macro is defined in config.macros.`,
        level: "error",
      });
    }
  }
}

function extractMacroInvocations(input: string): Set<string> {
  const names = new Set<string>();
  const s = input;

  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  while (i < s.length) {
    const ch = s[i]!;

    if (inSingle) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "'") inSingle = false;
      i++;
      continue;
    }

    if (inDouble) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      i++;
      continue;
    }

    if (isIdentStart(ch)) {
      const start = i;
      i++;
      while (i < s.length && isIdentPart(s[i]!)) i++;
      const name = s.slice(start, i);
      if (s[i] === "<") names.add(name);
      continue;
    }

    i++;
  }

  return names;
}

function extractBareIdentifiers(input: string): Set<string> {
  const names = new Set<string>();
  const s = input;

  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  while (i < s.length) {
    const ch = s[i]!;

    if (inSingle) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "'") inSingle = false;
      i++;
      continue;
    }
    if (inDouble) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      i++;
      continue;
    }

    // Skip Lezer directives like @digit/@specialize and pattern constructs like $[...]
    if (ch === "@" || ch === "$") {
      i++;
      continue;
    }

    if (isIdentStart(ch)) {
      const start = i;
      i++;
      while (i < s.length && isIdentPart(s[i]!)) i++;
      const name = s.slice(start, i);
      names.add(name);
      continue;
    }

    i++;
  }

  return names;
}

function findBalanceProblems(input: string): string[] {
  const problems: string[] = [];
  const stack: string[] = [];

  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  const openToClose: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closeToOpen: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    if (inSingle) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inDouble = false;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }

    if (openToClose[ch]) {
      stack.push(ch);
      continue;
    }

    if (closeToOpen[ch]) {
      const expectedOpen = closeToOpen[ch]!;
      const actualOpen = stack.pop();
      if (actualOpen !== expectedOpen) {
        problems.push(`unbalanced delimiter near '${ch}'.`);
        break;
      }
    }
  }

  if (inSingle) problems.push("unterminated single-quoted string.");
  if (inDouble) problems.push("unterminated double-quoted string.");
  if (stack.length > 0)
    problems.push("unbalanced delimiters (missing closing bracket/paren).");

  return problems;
}

function findDelimiterTokenBalanceProblems(input: string): string[] {
  const problems: string[] = [];
  const counts = countIdentifiers(input);

  const parenDelta =
    (counts.get("OpenParen") || 0) - (counts.get("CloseParen") || 0);
  if (parenDelta !== 0) {
    problems.push("unbalanced paren tokens (OpenParen/CloseParen).");
  }

  const bracketDelta =
    (counts.get("OpenBracket") || 0) - (counts.get("CloseBracket") || 0);
  if (bracketDelta !== 0) {
    problems.push("unbalanced bracket tokens (OpenBracket/CloseBracket).");
  }

  return problems;
}

function countIdentifiers(input: string): Map<string, number> {
  const counts = new Map<string, number>();
  const s = input;

  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  while (i < s.length) {
    const ch = s[i]!;

    if (inSingle) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "'") inSingle = false;
      i++;
      continue;
    }
    if (inDouble) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      i++;
      continue;
    }

    if (ch === "@" || ch === "$") {
      i++;
      continue;
    }

    if (isIdentStart(ch)) {
      const start = i;
      i++;
      while (i < s.length && isIdentPart(s[i]!)) i++;
      const name = s.slice(start, i);
      counts.set(name, (counts.get(name) || 0) + 1);
      continue;
    }

    i++;
  }

  return counts;
}

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}
