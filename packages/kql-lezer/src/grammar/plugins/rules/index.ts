import type { RuleDef } from "@fossiq/lezer-grammar-generator";
import { queryRules } from "./query";
import { letStatementRules } from "./let-statement";
import { pipelineRules } from "./pipeline";
import { whereClauseRules } from "./where-clause";
import { expressionRules } from "./expressions";
import { projectOperatorRules } from "./project-operators";
import { tabularOperatorRule } from "./tabular-operator";
import { joinOperatorRules } from "./join-operators";
import { dataOperatorRules } from "./data-operators";
import { pluginOperatorRules } from "./plugin-operators";
import { miscOperatorRules } from "./misc-operators";
import { statementRules } from "./statements";
import { standardOperatorRules } from "./standard-operators";

/**
 * All grammar rules for KQL.
 * Organized by category for maintainability.
 */
export const allRules: Record<string, RuleDef> = {
  ...queryRules,
  ...letStatementRules,
  ...statementRules,
  ...pipelineRules,
  ...whereClauseRules,
  ...projectOperatorRules,
  ...expressionRules,
  ...tabularOperatorRule,
  ...joinOperatorRules,
  ...dataOperatorRules,
  ...pluginOperatorRules,
  ...miscOperatorRules,
  ...standardOperatorRules,
};

// Re-export individual rule groups
export {
  queryRules,
  letStatementRules,
  statementRules,
  pipelineRules,
  whereClauseRules,
  projectOperatorRules,
  expressionRules,
  tabularOperatorRule,
  joinOperatorRules,
  dataOperatorRules,
  pluginOperatorRules,
  miscOperatorRules,
  standardOperatorRules,
};
