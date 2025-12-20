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
  // Common substitutions
  let result = pattern;

  // Quote @ that is not followed by a letter
  result = result.replace(/@(?![a-zA-Z])/g, '"@"');

  // Remove non-capturing groups: (?:...) -> (...)
  result = result.replace(/\(\?:/g, "(");

  // Replace escaped parentheses and braces with quoted literals
  result = result.replace(/\\([(){}])/g, '"$1"');

  // Replace \d with @digit before processing character classes
  result = result.replace(/\\d/g, "@digit");

  // Replace common character classes with Lezer equivalents
  result = result.replace(/\[0-9\]/g, "@digit");
  result = result.replace(/\[a-zA-Z\]/g, "@asciiLetter");

  // Handle negated character classes: [^...] -> ![...]
  result = result.replace(/\[\^([^\]]+)\]/g, "![$1]");

  // Wrap remaining character classes in $[...]
  result = result.replace(/(?<!!)\[([^\]]+)\]/g, "$[$1]");

  return result;
}

/** Serialize a GrammarDefinition into Lezer .grammar text. */
export function generateLezerGrammar(def: GrammarDefinition): string {
  const sections: string[] = [];

  if (def.tokens && def.tokens.length > 0) {
    sections.push(renderTokens(def.tokens));
  }

  if (def.externals && def.externals.length > 0) {
    sections.push(renderExternals(def.externals));
  }

  if (def.precedence && def.precedence.length > 0) {
    sections.push(renderPrecedence(def.precedence));
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
  const lines = sorted.map(
    (token) => `  ${token.name} { ${serializePattern(token.pattern)} }`,
  );
  return `@tokens {\n${lines.join("\n")}\n}`;
}

function renderExternals(externals: readonly string[]): string {
  const sorted = [...externals].sort((a, b) => a.localeCompare(b));
  const lines = sorted.map((name) => `  ${name}`);
  return `@external tokens {\n${lines.join("\n")}\n}`;
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
  const props = formatProps(rule.props);
  const expr = serializePattern(rule.expression);
  const ruleText = `${name}${params}${props} { ${expr} }`;

  if (rule.skip) {
    return `@skip { ${serializePattern(rule.skip)} } {\n  ${ruleText}\n}`;
  }

  return ruleText;
}

function formatProps(props: RuleDef["props"]): string {
  if (!props) return "";
  const keys = Object.keys(props).sort((a, b) => a.localeCompare(b));
  const entries = keys.map((key) => `${key}=${formatPropValue(props[key])}`);
  return entries.length > 0 ? `[${entries.join(", ")}]` : "";
}

function formatPropValue(value: string | number | boolean): string {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function serializePattern(
  expr: PatternExpression,
  depthLimit = DEFAULT_DEPTH_LIMIT,
): string {
  const parts: string[] = [];
  const stack: Array<
    | { type: "expr"; expr: PatternExpression; depth: number }
    | { type: "text"; text: string }
  > = [{ type: "expr", expr, depth: 0 }];

  while (stack.length > 0) {
    const frame = stack.pop()!;
    if (frame.type === "text") {
      parts.push(frame.text);
      continue;
    }

    const current = frame.expr;
    if (frame.depth > depthLimit) {
      throw new Error("Pattern expression exceeds depth limit.");
    }
    switch (current.type) {
      case "literal":
        parts.push(JSON.stringify(current.value));
        break;
      case "regex": {
        const pattern =
          typeof current.pattern === "string"
            ? current.pattern
            : current.pattern.source;
        parts.push(convertRegexToLezer(pattern));
        break;
      }
      case "raw":
        parts.push(current.content);
        break;
      case "ref":
        parts.push(current.name);
        if (current.args && current.args.length > 0) {
          parts.push(`<${current.args.join(", ")}>`);
        }
        break;
      case "seq": {
        for (let i = current.elements.length - 1; i >= 0; i--) {
          if (i < current.elements.length - 1) {
            stack.push({ type: "text", text: " " });
          }
          stack.push({
            type: "expr",
            expr: current.elements[i]!,
            depth: frame.depth + 1,
          });
        }
        break;
      }
      case "choice": {
        for (let i = current.alternatives.length - 1; i >= 0; i--) {
          if (i < current.alternatives.length - 1) {
            stack.push({ type: "text", text: " | " });
          }
          stack.push({
            type: "expr",
            expr: current.alternatives[i]!,
            depth: frame.depth + 1,
          });
        }
        break;
      }
      case "repeat":
        stack.push({ type: "text", text: current.kind });
        stack.push({
          type: "expr",
          expr: current.expr,
          depth: frame.depth + 1,
        });
        break;
      case "optional":
        stack.push({ type: "text", text: "?" });
        stack.push({
          type: "expr",
          expr: current.expr,
          depth: frame.depth + 1,
        });
        break;
      case "group":
        stack.push({ type: "text", text: ")" });
        stack.push({
          type: "expr",
          expr: current.expr,
          depth: frame.depth + 1,
        });
        stack.push({ type: "text", text: "(" });
        break;
      default: {
        const neverExpr: never = current;
        throw new Error(`Unknown pattern type: ${String(neverExpr)}`);
      }
    }
  }

  return parts.join("");
}
