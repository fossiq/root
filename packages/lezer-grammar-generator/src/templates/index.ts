import { TemplateManager } from "./template-manager.js";

// Import serialization templates
import tokensTemplate from "./sections/tokens.eta?raw";
import localTokensTemplate from "./sections/local-tokens.eta?raw";
import externalsTemplate from "./sections/externals.eta?raw";
import dialectsTemplate from "./sections/dialects.eta?raw";
import precedenceTemplate from "./sections/precedence.eta?raw";
import detectDelimTemplate from "./sections/detectDelim.eta?raw";
import skipTemplate from "./sections/skip.eta?raw";
import topTemplate from "./sections/top.eta?raw";
import rulesTemplate from "./sections/rules.eta?raw";

// Import generator templates
import configTemplate from "./generator/config.eta?raw";
import tokenSectionTemplate from "./generator/token-section.eta?raw";
import ruleSectionTemplate from "./generator/rule-section.eta?raw";
import precedenceSectionTemplate from "./generator/precedence-section.eta?raw";
import macroSectionTemplate from "./generator/macro-section.eta?raw";

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
