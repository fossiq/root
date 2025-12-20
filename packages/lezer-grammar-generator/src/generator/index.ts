export { generateGrammar, generateGrammarFromPlugins } from "./main.js";
export {
  generateMacrosSection,
  generateTokensSection,
  generateRulesSection,
  generatePrecedenceSection,
  defaultTokenNames,
} from "./sections.js";
export {
  mergePlugins,
  mergePrecedence,
  rulesToAstTypes,
  orderPlugins,
} from "./plugins.js";
export { getStartRule, getCommentToken } from "./utils.js";
export { validateConfig } from "./validation.js";
