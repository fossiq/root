import type { RuleDef } from "@fossiq/lezer-grammar-generator";
import { queryRules } from "./query";
import { letStatementRules } from "./let-statement";
import { pipelineRules } from "./pipeline";
import { whereClauseRules } from "./where-clause";
import { expressionRules } from "./expressions";
import { projectOperatorRules } from "./project-operators";

/**
 * All grammar rules for KQL.
 * Organized by category for maintainability.
 */
export const allRules: Record<string, RuleDef> = {
  ...queryRules,
  ...letStatementRules,
  ...pipelineRules,
  ...whereClauseRules,
  ...projectOperatorRules,
  ...expressionRules,
};

// Re-export individual rule groups
export {
  queryRules,
  letStatementRules,
  pipelineRules,
  whereClauseRules,
  projectOperatorRules,
  expressionRules,
};
