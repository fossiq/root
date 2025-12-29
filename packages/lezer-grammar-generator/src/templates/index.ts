import { TemplateManager } from "./template-manager.js";

// Import serialization templates
import tokensTemplate from "./sections/tokens.eta" with { type: "text" };
import localTokensTemplate from "./sections/local-tokens.eta" with { type: "text" };
import externalsTemplate from "./sections/externals.eta" with { type: "text" };
import dialectsTemplate from "./sections/dialects.eta" with { type: "text" };
import precedenceTemplate from "./sections/precedence.eta" with { type: "text" };
import detectDelimTemplate from "./sections/detectDelim.eta" with { type: "text" };
import skipTemplate from "./sections/skip.eta" with { type: "text" };
import topTemplate from "./sections/top.eta" with { type: "text" };
import rulesTemplate from "./sections/rules.eta" with { type: "text" };

// Import generator templates
import configTemplate from "./generator/config.eta" with { type: "text" };
import tokenSectionTemplate from "./generator/token-section.eta" with { type: "text" };
import ruleSectionTemplate from "./generator/rule-section.eta" with { type: "text" };
import precedenceSectionTemplate from "./generator/precedence-section.eta" with { type: "text" };
import macroSectionTemplate from "./generator/macro-section.eta" with { type: "text" };

/**
 * Global TemplateManager instance for grammar generation.
 */
const templateManager = new TemplateManager();

// Load serialization templates
templateManager.load("tokens", tokensTemplate);
templateManager.load("local-tokens", localTokensTemplate);
templateManager.load("externals", externalsTemplate);
templateManager.load("dialects", dialectsTemplate);
templateManager.load("precedence", precedenceTemplate);
templateManager.load("detectDelim", detectDelimTemplate);
templateManager.load("skip", skipTemplate);
templateManager.load("top", topTemplate);
templateManager.load("rules", rulesTemplate);

// Load generator templates
templateManager.load("config", configTemplate);
templateManager.load("token-section", tokenSectionTemplate);
templateManager.load("rule-section", ruleSectionTemplate);
templateManager.load("precedence-section", precedenceSectionTemplate);
templateManager.load("macro-section", macroSectionTemplate);

export { templateManager };
