import type {
  GrammarDefinition,
  MacroDef,
  PrecedenceLevel,
  RuleDef,
  TokenDef,
} from "../model.js";
import { templateManager } from "../templates/index.js";
import { formatProps, expandMacrosInText } from "../templates/helpers.js";
import { serializePattern } from "../serialization/pattern-serialize.js";

/** Serialize a GrammarDefinition into Lezer .grammar text. */
export function generateLezerGrammar(def: GrammarDefinition): string {
  const sections: string[] = [];

  if (def.tokens && def.tokens.length > 0) {
    const sortedTokens = [...def.tokens].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    sections.push(
      templateManager.render("tokens", {
        tokens: sortedTokens,
        serializePattern,
      }),
    );
  }

  if (def.localTokens && def.localTokens.length > 0) {
    const sortedLocalTokens = [...def.localTokens].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    sections.push(
      templateManager.render("local-tokens", {
        localTokens: sortedLocalTokens,
        serializePattern,
      }),
    );
  }

  if (def.externals && def.externals.length > 0) {
    const sortedExternals = [...def.externals].sort((a, b) =>
      a.localeCompare(b),
    );
    sections.push(
      templateManager.render("externals", { externals: sortedExternals }),
    );
  }

  if (def.dialects && def.dialects.length > 0) {
    const sortedDialects = [...def.dialects].sort((a, b) => a.localeCompare(b));
    sections.push(
      templateManager.render("dialects", { dialects: sortedDialects }),
    );
  }

  if (def.precedence && def.precedence.length > 0) {
    sections.push(
      templateManager.render("precedence", { precedence: def.precedence }),
    );
  }

  if (def.detectDelim) {
    sections.push(templateManager.render("detectDelim", {}));
  }

  if (def.skip) {
    sections.push(
      templateManager.render("skip", { skip: def.skip, serializePattern }),
    );
  }

  if (def.top) {
    sections.push(
      templateManager.render("top", { name: def.name, top: def.top }),
    );
  }

  // Prepare ordered rules
  const names = Object.keys(def.rules).sort((a, b) => a.localeCompare(b));
  const ordered =
    def.top && def.rules[def.top]
      ? [def.top, ...names.filter((n) => n !== def.top)]
      : names;
  const orderedRules = ordered.map((name) => ({
    name,
    rule: def.rules[name]!,
  }));

  sections.push(
    templateManager.render("rules", {
      orderedRules,
      macros: def.macros,
      serializePattern,
      formatProps,
      expandMacrosInText,
    }),
  );

  return `${sections.join("\n\n")}\n`;
}
