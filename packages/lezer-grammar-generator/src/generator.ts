export {
  generateGrammar,
  generateGrammarFromPlugins,
} from "./generator/main.js";
export {
  generateMacrosSection,
  generateTokensSection,
  generateRulesSection,
  generatePrecedenceSection,
  defaultTokenNames,
} from "./generator/sections.js";
export {
  mergePlugins,
  mergePrecedence,
  rulesToAstTypes,
  orderPlugins,
} from "./generator/plugins.js";
export { getStartRule, getCommentToken } from "./generator/utils.js";
export { validateConfig } from "./generator/validation.js";
