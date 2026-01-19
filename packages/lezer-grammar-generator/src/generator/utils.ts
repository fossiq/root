import { GrammarGeneratorConfig, TokenDefinition } from "../types.js";

export function getStartRule(config: GrammarGeneratorConfig): string {
  // Try to find a rule with a common start type
  const startRules = [
    "statement",
    "document",
    config.grammarName.toLowerCase(),
  ];

  for (const ruleName of startRules) {
    const rule = Object.values(config.astTypes).find(
      (def) => def.grammarName.toLowerCase() === ruleName,
    );
    if (rule && rule.isRule) {
      return rule.grammarName;
    }
  }

  // Fallback to first rule
  const firstRule = Object.values(config.astTypes).find((def) => def.isRule);
  return firstRule ? firstRule.grammarName : "statement";
}

export function getCommentToken(tokens: TokenDefinition[]): string {
  const commentToken = tokens.find(
    (t) =>
      t.name === "LineComment" ||
      t.name === "BlockComment" ||
      t.name === "comment",
  );
  return commentToken ? commentToken.name : "LineComment";
}
