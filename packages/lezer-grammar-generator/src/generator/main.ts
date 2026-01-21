import type { ValidationIssue } from "../model.js";
import {
  GrammarGeneratorConfig,
  GeneratedGrammar,
  PluginGrammarConfig,
} from "../types.js";
import { templateManager } from "../templates/index.js";
import { validateConfig } from "./validation.js";
import { getStartRule, getCommentToken } from "./utils.js";
import { mergePlugins, orderPlugins, rulesToAstTypes } from "./plugins.js";

export function generateGrammar(
  config: GrammarGeneratorConfig
): GeneratedGrammar {
  const tokens = config.tokens || [];
  const errors = validateConfig(config);
  const imports: string[] = [];

  // Prepare data for templates
  const overridden = new Set(tokens.map((t) => t.name));

  const defaultTokens = {
    delimiters: [
      { name: "Pipe", def: '"|"' },
      { name: "OpenParen", def: '"("' },
      { name: "CloseParen", def: '")"' },
      { name: "OpenBracket", def: '"["' },
      { name: "CloseBracket", def: '"]"' },
      { name: "Comma", def: '","' },
      { name: "Semicolon", def: '";"' },
      { name: "Equals", def: '"="' },
    ]
      .filter((t) => !overridden.has(t.name))
      .map((t) => ({ line: `  ${t.name} { ${t.def} }` })),
    math: [
      { name: "Plus", def: '"+"' },
      { name: "Minus", def: '"-"' },
      { name: "Star", def: '"*"' },
      { name: "Slash", def: '"/"' },
      { name: "Percent", def: '"%"' },
    ]
      .filter((t) => !overridden.has(t.name))
      .map((t) => ({ line: `  ${t.name} { ${t.def} }` })),
    comparison: [
      { name: "ComparisonOp", def: '"==" | "!=" | ">=" | "<=" | ">" | "<"' },
    ]
      .filter((t) => !overridden.has(t.name))
      .map((t) => ({ line: `  ${t.name} { ${t.def} }` })),
    basic: [
      { name: "Identifier", def: "$[a-zA-Z_] $[a-zA-Z0-9_]*" },
      { name: "Number", def: '@digit+ ("." @digit+)?' },
    ]
      .filter((t) => !overridden.has(t.name))
      .map((t) => ({ line: `  ${t.name} { ${t.def} }` })),
    comments: [
      { name: "LineComment", def: '"//" ![\n]*' },
      { name: "whitespace", def: "$[ \t\n\r]+" },
    ]
      .filter((t) => !overridden.has(t.name))
      .map((t) => ({ line: `  ${t.name} { ${t.def} }` })),
  };

  const customTokens = tokens.map((token) => {
    if ("specialized" in token) {
      return {
        line: `  ${token.name} { @specialize[@name=${token.name}]<${
          token.specialized.base
        }, ${JSON.stringify(token.specialized.term)}> }`,
      };
    } else {
      return { line: `  ${token.name} { ${token.pattern} }` };
    }
  });

  const tokensData = {
    defaultTokens,
    customTokens,
    overridden,
  };

  const tokensSection = templateManager.render("token-section", tokensData);

  // Prepare rules data
  const rules = Object.values(config.astTypes)
    .filter((def) => def.isRule)
    .map((def) => `${def.grammarName} { ${def.grammarFields} }`);

  const rulesSection = templateManager.render("rule-section", { rules });

  // Prepare precedence data
  const precedenceRules: { name: string; precedence: number }[] = [];
  for (const def of Object.values(config.astTypes)) {
    if (def.precedence !== undefined) {
      precedenceRules.push({
        name: def.grammarName,
        precedence: def.precedence,
      });
    }
  }

  let precedenceData: {
    precedenceRules: typeof config.precedence | typeof precedenceRules;
    hasConfigPrecedence?: boolean;
    configPrecedence?: string;
  } = { precedenceRules: [] };
  if (config.precedence && config.precedence.length > 0) {
    precedenceData = {
      precedenceRules: config.precedence,
      hasConfigPrecedence: true,
      configPrecedence: config.precedence.join(",\n    "),
    };
  } else if (precedenceRules.length > 0) {
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
    const groupedPrecedence = levels.map((level) => byLevel[level].join(", "));
    precedenceData = {
      precedenceRules,
      hasConfigPrecedence: false,
      groupedPrecedence,
    };
  }

  const precedenceSection = templateManager.render(
    "precedence-section",
    precedenceData
  );

  // Prepare macros data
  const macrosSection = templateManager.render("macro-section", {
    macros: config.macros,
  });

  // Build top rule
  const topRule = `@top ${config.grammarName} { ${getStartRule(config)} }`;

  // Build skip section
  const skipSection =
    config.skipWhitespace !== false
      ? `@skip { whitespace | ${getCommentToken(tokens)} }`
      : "";

  if (!templateManager.has("config")) {
    throw new Error("Config template not loaded");
  }
  const grammar = templateManager.render("config", {
    topRule,
    rulesSection,
    tokensSection,
    precedenceSection,
    skipSection,
    macrosSection,
  });

  return {
    grammar,
    imports,
    errors,
  };
}

export function generateGrammarFromPlugins(
  config: PluginGrammarConfig
): GeneratedGrammar {
  const pluginErrors: ValidationIssue[] = [];
  const orderedPlugins = orderPlugins(config.plugins, pluginErrors);

  const merged = mergePlugins(orderedPlugins, config, pluginErrors);

  const astTypes = rulesToAstTypes(merged.rules);

  const result = generateGrammar({
    grammarName: config.grammarName,
    astTypes,
    tokens: merged.tokens,
    macros: merged.macros,
    precedence: merged.precedence,
    skipWhitespace: merged.skipWhitespace,
    validation: config.validation,
  });

  return {
    grammar: result.grammar,
    imports: result.imports,
    errors: [...pluginErrors, ...result.errors],
  };
}
