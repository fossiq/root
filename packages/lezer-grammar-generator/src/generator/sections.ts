import { GrammarGeneratorConfig, TokenDefinition } from "../types.js";

export function generateMacrosSection(macros?: {
  [name: string]: string;
}): string {
  if (!macros) return "";
  return Object.entries(macros)
    .map(([name, body]) => `${name} { ${body} }`)
    .join("\n");
}

export function generateTokensSection(tokens: TokenDefinition[]): string {
  const tokenLines: string[] = [];
  const overridden = new Set(tokens.map((t) => t.name));

  const addDefault = (name: string, def: string) => {
    if (!overridden.has(name)) {
      tokenLines.push(`  ${name} { ${def} }`);
    }
  };

  tokenLines.push("  // Delimiters");
  addDefault("Pipe", '"|"');
  addDefault("OpenParen", '"("');
  addDefault("CloseParen", '")"');
  addDefault("OpenBracket", '"["');
  addDefault("CloseBracket", '"]"');
  addDefault("Comma", '","');
  addDefault("Semicolon", '";"');
  addDefault("Equals", '"="');
  tokenLines.push("");

  tokenLines.push("  // Math operators");
  addDefault("Plus", '"+"');
  addDefault("Minus", '"-"');
  addDefault("Star", '"*"');
  addDefault("Slash", '"/"');
  addDefault("Percent", '"%"');
  tokenLines.push("");

  tokenLines.push("  // Comparison operators");
  addDefault("ComparisonOp", '"==" | "!=" | ">=" | "<=" | ">" | "<"');
  tokenLines.push("");

  tokenLines.push("  // Basic tokens");
  addDefault("Identifier", "$[a-zA-Z_] $[a-zA-Z0-9_]*");
  addDefault("Number", '@digit+ ("." @digit+)?');

  if (!overridden.has("String")) {
    tokenLines.push("  String {");
    tokenLines.push("    // Standard double quoted");
    tokenLines.push('    """ (!["\\\n] | "\\" _)* """ |');
    tokenLines.push("    // Standard single quoted");
    tokenLines.push('    "\'" (![\'\\\n] | "\\" _)* "\'"');
    tokenLines.push("  }");
  }
  tokenLines.push("");

  tokenLines.push("  // Comments");
  addDefault("LineComment", '"//" ![\n]*');
  addDefault("whitespace", "$[ \t\n\r]+");

  // Add custom tokens
  if (tokens.length > 0) {
    tokenLines.push("");
    tokenLines.push("  // Custom tokens");
    tokens.forEach((token) => {
      if ("specialized" in token) {
        tokenLines.push(
          `  ${token.name} { @specialize[@name=${token.name}]<${
            token.specialized.base
          }, ${JSON.stringify(token.specialized.term)}> }`,
        );
      } else {
        tokenLines.push(`  ${token.name} { ${token.pattern} }`);
      }
    });
  }

  return tokenLines.join("\n");
}

export function generateRulesSection(config: GrammarGeneratorConfig): string {
  const rules: string[] = [];

  for (const def of Object.values(config.astTypes)) {
    if (def.isRule) {
      rules.push(`${def.grammarName} { ${def.grammarFields} }`);
    }
  }

  return rules.join("\n\n");
}

export function generatePrecedenceSection(
  config: GrammarGeneratorConfig,
): string {
  if (config.precedence && config.precedence.length > 0) {
    return `\n\n  @precedence {\n    ${config.precedence.join(",\n    ")}\n  }`;
  }

  const precedenceRules: { name: string; precedence: number }[] = [];

  for (const def of Object.values(config.astTypes)) {
    if (def.precedence !== undefined) {
      precedenceRules.push({
        name: def.grammarName,
        precedence: def.precedence,
      });
    }
  }

  if (precedenceRules.length === 0) {
    return "";
  }

  // Group by precedence level
  const byLevel: { [level: number]: string[] } = {};
  precedenceRules.forEach((rule) => {
    if (!byLevel[rule.precedence]) {
      byLevel[rule.precedence] = [];
    }
    byLevel[rule.precedence].push(rule.name);
  });

  const levels = Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b);
  const precedenceLines = levels.map((level) => {
    return `    ${byLevel[level].join(", ")},`;
  });

  return `\n\n  @precedence {\n${precedenceLines.join("\n")}\n  }`;
}

export const defaultTokenNames = [
  // Delimiters
  "Pipe",
  "OpenParen",
  "CloseParen",
  "OpenBracket",
  "CloseBracket",
  "Comma",
  "Semicolon",
  "Equals",
  // Math operators
  "Plus",
  "Minus",
  "Star",
  "Slash",
  "Percent",
  // Comparison operators
  "ComparisonOp",
  // Basic tokens
  "Identifier",
  "Number",
  "String",
  // Comments
  "LineComment",
  "whitespace",
] as const;
