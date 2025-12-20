import {
  GrammarPlugin,
  PluginGrammarConfig,
  TokenDefinition,
} from "../types.js";

export function mergePlugins(
  plugins: GrammarPlugin[],
  config: PluginGrammarConfig,
  errors: string[],
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
        errors.push(
          `Conflicting skipWhitespace across plugins (found both ${String(
            skipWhitespace,
          )} and ${String(plugin.skipWhitespace)}).`,
        );
      }
    }

    for (const token of plugin.tokens ?? []) {
      if (tokenNames.has(token.name)) {
        errors.push(`Duplicate token name '${token.name}' across plugins.`);
        continue;
      }
      tokenNames.add(token.name);
      tokens.push(token);
    }

    for (const [name, rule] of Object.entries(plugin.rules ?? {})) {
      if (rules.has(name)) {
        errors.push(`Duplicate rule name '${name}' across plugins.`);
        continue;
      }
      rules.set(name, rule);
    }

    for (const [name, body] of Object.entries(plugin.macros ?? {})) {
      if (macros.has(name)) {
        const existing = macros.get(name);
        if (existing !== body) {
          errors.push(`Duplicate macro name '${name}' across plugins.`);
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

export function rulesToAstTypes(rules: Map<string, string>) {
  const astTypes: any = {};
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
  errors: string[],
): GrammarPlugin[] {
  const byName = new Map<string, GrammarPlugin>();

  for (const plugin of plugins) {
    if (!plugin.name || typeof plugin.name !== "string") {
      errors.push("All plugins must have a non-empty `name`.");
      continue;
    }
    if (byName.has(plugin.name)) {
      errors.push(`Duplicate plugin name '${plugin.name}'.`);
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
      errors.push(`Cyclic plugin dependency detected at '${name}'.`);
      return;
    }
    const plugin = byName.get(name);
    if (!plugin) return;

    visiting.add(name);
    for (const dep of plugin.dependsOn ?? []) {
      if (!byName.has(dep)) {
        errors.push(`Plugin '${name}' depends on missing plugin '${dep}'.`);
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
