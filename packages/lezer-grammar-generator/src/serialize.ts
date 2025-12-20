import type {
  GrammarDefinition,
  PatternExpression,
  PrecedenceLevel,
  RuleDef,
  TokenDef,
} from "./model.js";

const DEFAULT_DEPTH_LIMIT = 1000;

/**
 * Convert a regex pattern to Lezer's native token syntax.
 *
 * Lezer uses:
 * - $[...] for character classes
 * - @digit for [0-9]
 * - @asciiLetter for [a-zA-Z]
 * - ![] for negated character classes
 * - + * ? for repetition
 *
 * This is a best-effort conversion for common patterns.
 */
function convertRegexToLezer(pattern: string): string {
  let result = pattern;

  // Step 1: Handle special characters that need quoting
  // Quote literal @ not followed by a letter (to avoid interfering with Lezer builtins)
  result = result.replace(/@(?![a-zA-Z])/g, '"@"');

  // Quote escaped parentheses and braces to treat them as literals
  result = result.replace(/\\([(){}])/g, '"$1"');

  // Step 2: Simplify regex constructs
  // Remove non-capturing groups: (?:...) -> (...)
  result = result.replace(/\(\?:/g, "(");

  // Step 3: Convert common character classes to Lezer builtins
  // Must do \d before [0-9] to avoid double conversion
  result = result.replace(/\\d/g, "@digit");
  result = result.replace(/\[0-9\]/g, "@digit");
  result = result.replace(/\[a-zA-Z\]/g, "@asciiLetter");

  // Step 4: Handle negated character classes
  // [^...] -> ![...]
  result = result.replace(/\[\^([^\]]+)\]/g, "![$1]");

  // Step 5: Wrap remaining character classes in Lezer's $[...] syntax
  // Skip already negated ones (lookbehind for !)
  result = result.replace(/(?<!!)\[([^\]]+)\]/g, "$[$1]");

  return result;
}

/** Serialize a GrammarDefinition into Lezer .grammar text. */
export function generateLezerGrammar(def: GrammarDefinition): string {
  const sections: string[] = [];

  if (def.tokens && def.tokens.length > 0) {
    sections.push(renderTokens(def.tokens));
  }

  if (def.localTokens && def.localTokens.length > 0) {
    sections.push(renderLocalTokens(def.localTokens));
  }

  if (def.externals && def.externals.length > 0) {
    sections.push(renderExternals(def.externals));
  }

  if (def.dialects && def.dialects.length > 0) {
    sections.push(renderDialects(def.dialects));
  }

  if (def.precedence && def.precedence.length > 0) {
    sections.push(renderPrecedence(def.precedence));
  }

  if (def.detectDelim) {
    sections.push("@detectDelim");
  }

  if (def.skip) {
    sections.push(`@skip { ${serializePattern(def.skip)} }`);
  }

  if (def.top) {
    sections.push(renderTop(def.name, def.top));
  }

  sections.push(renderRules(def.rules, def.top));

  return `${sections.join("\n\n")}\n`;
}

function renderTokens(tokens: readonly TokenDef[]): string {
  const sorted = [...tokens].sort((a, b) => a.name.localeCompare(b.name));
  const lines = sorted.map((token) => {
    const pattern = serializePattern(token.pattern);
    const props = token.dialect ? `[@dialect=${token.dialect}]` : "";
    return `  ${token.name}${props} { ${pattern} }`;
  });
  return `@tokens {\n${lines.join("\n")}\n}`;
}

function renderLocalTokens(tokens: readonly TokenDef[]): string {
  const sorted = [...tokens].sort((a, b) => a.name.localeCompare(b.name));
  const lines = sorted.map((token) => {
    const pattern = serializePattern(token.pattern);
    const props = token.dialect ? `[@dialect=${token.dialect}]` : "";
    return `  ${token.name}${props} { ${pattern} }`;
  });
  return `@local tokens {\n${lines.join("\n")}\n}`;
}

function renderExternals(externals: readonly string[]): string {
  const sorted = [...externals].sort((a, b) => a.localeCompare(b));
  const lines = sorted.map((name) => `  ${name}`);
  return `@external tokens {\n${lines.join("\n")}\n}`;
}

function renderDialects(dialects: readonly string[]): string {
  const sorted = [...dialects].sort((a, b) => a.localeCompare(b));
  return `@dialects { ${sorted.join(", ")} }`;
}

function renderPrecedence(precedence: readonly PrecedenceLevel[]): string {
  const lines = precedence.map((level) => {
    const assoc = level.associativity ? `${level.associativity} ` : "";
    return `  ${assoc}${level.name};`;
  });
  return `@precedence {\n${lines.join("\n")}\n}`;
}

function renderTop(name: string | undefined, top: string): string {
  if (!name) {
    return `@top { ${top} }`;
  }
  return `@top ${name} { ${top} }`;
}

function renderRules(
  rules: Readonly<Record<string, RuleDef>>,
  top?: string,
): string {
  const names = Object.keys(rules).sort((a, b) => a.localeCompare(b));
  const ordered =
    top && rules[top] ? [top, ...names.filter((n) => n !== top)] : names;

  return ordered.map((name) => renderRule(name, rules[name]!)).join("\n\n");
}

function renderRule(name: string, rule: RuleDef): string {
  const params =
    rule.params && rule.params.length > 0 ? `<${rule.params.join(", ")}>` : "";
  const props = formatProps(rule.props, rule.dialect);
  const expr = serializePattern(rule.expression);
  const ruleText = `${name}${params}${props} { ${expr} }`;

  if (rule.skip) {
    return `@skip { ${serializePattern(rule.skip)} } {\n  ${ruleText}\n}`;
  }

  return ruleText;
}

function formatProps(props: RuleDef["props"], dialect?: string): string {
  const allProps: Record<string, string | number | boolean> = { ...props };
  if (!allProps || Object.keys(allProps).length === 0) {
    if (dialect) return `[@dialect=${dialect}]`;
    return "";
  }
  const keys = Object.keys(allProps).sort((a, b) => a.localeCompare(b));
  const entries = keys.map((key) => {
    const value = allProps[key];
    if (key === "@dialect") {
      return `${key}=${value}`;
    }
    return `${key}=${formatPropValue(value)}`;
  });
  const propStr = entries.length > 0 ? `[${entries.join(", ")}]` : "";
  if (dialect) {
    return propStr
      ? `${propStr.slice(0, -1)}, @dialect=${dialect}]`
      : `[@dialect=${dialect}]`;
  }
  return propStr;
}

function formatPropValue(value: string | number | boolean): string {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function serializePattern(
  expr: PatternExpression,
  depthLimit = DEFAULT_DEPTH_LIMIT,
): string {
  return serializeExpr(expr, 0, depthLimit);
}

function serializeExpr(
  expr: PatternExpression,
  depth: number,
  limit: number,
): string {
  if (depth > limit) {
    throw new Error("Pattern expression exceeds depth limit.");
  }

  switch (expr.type) {
    case "literal":
      return JSON.stringify(expr.value);
    case "regex": {
      const pattern =
        typeof expr.pattern === "string" ? expr.pattern : expr.pattern.source;
      return convertRegexToLezer(pattern);
    }
    case "raw":
      return expr.content;
    case "ref": {
      let result = expr.name;
      if (expr.args && expr.args.length > 0) {
        result += `<${expr.args.join(", ")}>`;
      }
      return result;
    }
    case "seq": {
      const parts = expr.elements.map((e) =>
        serializeExpr(e, depth + 1, limit),
      );
      return parts.join(" ");
    }
    case "choice": {
      const parts = expr.alternatives.map((e) =>
        serializeExpr(e, depth + 1, limit),
      );
      return parts.join(" | ");
    }
    case "repeat":
      return serializeExpr(expr.expr, depth + 1, limit) + expr.kind;
    case "optional":
      return serializeExpr(expr.expr, depth + 1, limit) + "?";
    case "group":
      return "(" + serializeExpr(expr.expr, depth + 1, limit) + ")";
    default: {
      const neverExpr: never = expr;
      throw new Error(`Unknown pattern type: ${String(neverExpr)}`);
    }
  }
}
