import type { ValidationIssue } from "../model.js";
import {
  GrammarPlugin,
  PluginGrammarConfig,
  TokenDefinition,
  ASTTypeDefinition,
} from "../types.js";

export function mergePlugins(
  plugins: GrammarPlugin[],
  config: PluginGrammarConfig,
  errors: ValidationIssue[],
): {
  tokens: TokenDefinition[];
  rules: Map<string, string>;
  macros: { [name: string]: string } | undefined;
  precedence: string[] | undefined;
  skipWhitespace: boolean | undefined;
} {
  const tokens: TokenDefinition[] = [];
  const tokenNames = new Set<string>();
  const rules = new Map<string, string>();
  const macros = new Map<string, string>();

  let skipWhitespace: boolean | undefined = config.skipWhitespace;

  for (const plugin of plugins) {
    if (plugin.skipWhitespace !== undefined) {
      if (skipWhitespace === undefined) {
        skipWhitespace = plugin.skipWhitespace;
      } else if (skipWhitespace !== plugin.skipWhitespace) {
        errors.push({
          code: "plugins.skipWhitespace.conflict",
          message: `Conflicting skipWhitespace across plugins (found both ${String(
            skipWhitespace,
          )} and ${String(plugin.skipWhitespace)}).`,
          level: "error",
        });
      }
    }

    for (const token of plugin.tokens ?? []) {
      if (tokenNames.has(token.name)) {
        errors.push({
          code: "plugins.tokens.duplicate",
          message: `Duplicate token name '${token.name}' across plugins.`,
          level: "error",
        });
        continue;
      }
      tokenNames.add(token.name);
      tokens.push(token);
    }

    for (const [name, rule] of Object.entries(plugin.rules ?? {})) {
      if (rules.has(name)) {
        errors.push({
          code: "plugins.rules.duplicate",
          message: `Duplicate rule name '${name}' across plugins.`,
          level: "error",
        });
        continue;
      }
      rules.set(name, rule);
    }

    for (const [name, body] of Object.entries(plugin.macros ?? {})) {
      if (macros.has(name)) {
        const existing = macros.get(name);
        if (existing !== body) {
          errors.push({
            code: "plugins.macros.duplicate",
            message: `Duplicate macro name '${name}' across plugins.`,
            level: "error",
          });
        }
        continue;
      }
      macros.set(name, body);
    }
  }

  const precedence =
    config.precedence ??
    mergePrecedence(plugins.map((plugin) => plugin.precedence ?? []));

  return {
    tokens,
    rules,
    macros: macros.size > 0 ? Object.fromEntries(macros) : undefined,
    precedence,
    skipWhitespace,
  };
}

export function mergePrecedence(
  precedenceGroups: string[][],
): string[] | undefined {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const group of precedenceGroups) {
    for (const token of group) {
      if (seen.has(token)) continue;
      seen.add(token);
      merged.push(token);
    }
  }

  return merged.length > 0 ? merged : undefined;
}

export function rulesToAstTypes(
  rules: Map<string, string>,
): Record<string, ASTTypeDefinition> {
  const astTypes: Record<string, ASTTypeDefinition> = {};
  for (const [name, grammarFields] of rules) {
    astTypes[name] = {
      grammarName: name,
      grammarFields,
      isRule: true,
    };
  }
  return astTypes;
}

export function orderPlugins(
  plugins: GrammarPlugin[],
  errors: ValidationIssue[],
): GrammarPlugin[] {
  const byName = new Map<string, GrammarPlugin>();

  for (const plugin of plugins) {
    if (!plugin.name || typeof plugin.name !== "string") {
      errors.push({
        code: "plugins.name.missing",
        message: "All plugins must have a non-empty `name`.",
        level: "error",
      });
      continue;
    }
    if (byName.has(plugin.name)) {
      errors.push({
        code: "plugins.name.duplicate",
        message: `Duplicate plugin name '${plugin.name}'.`,
        level: "error",
      });
      continue;
    }
    byName.set(plugin.name, plugin);
  }

  const ordered: GrammarPlugin[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (name: string) => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      errors.push({
        code: "plugins.dependency.cyclic",
        message: `Cyclic plugin dependency detected at '${name}'.`,
        level: "error",
      });
      return;
    }
    const plugin = byName.get(name);
    if (!plugin) return;

    visiting.add(name);
    for (const dep of plugin.dependsOn ?? []) {
      if (!byName.has(dep)) {
        errors.push({
          code: "plugins.dependency.missing",
          message: `Plugin '${name}' depends on missing plugin '${dep}'.`,
          level: "error",
        });
        continue;
      }
      visit(dep);
    }
    visiting.delete(name);
    visited.add(name);
    ordered.push(plugin);
  };

  for (const plugin of plugins) {
    if (plugin.name && byName.has(plugin.name)) {
      visit(plugin.name);
    }
  }

  return ordered;
}
