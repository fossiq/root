import { literal, type TokenDef } from "@fossiq/lezer-grammar-generator";

/**
 * Special keyword tokens for KQL that require exact matching.
 *
 * These are multi-word operators or operators with special characters that need
 * to be recognized as complete tokens rather than individual identifiers.
 */
export const keywordTokens: TokenDef[] = [
  // Project operators: control column projection and modification
  { name: "ProjectAway", pattern: literal("project-away") },
  { name: "ProjectKeep", pattern: literal("project-keep") },
  { name: "ProjectRename", pattern: literal("project-rename") },
  { name: "ProjectReorder", pattern: literal("project-reorder") },

  // Expansion operator: expands multi-value columns into separate rows
  { name: "MvExpand", pattern: literal("mv-expand") },

  // Time series creation
  { name: "MakeSeries", pattern: literal("make-series") },

  // Range operator: used in range expressions
  { name: "RangeDoubleDot", pattern: literal("..") },

  // Negation operators: logical negation for filter conditions
  { name: "NotBetween", pattern: literal("!between") },
  { name: "NotContains", pattern: literal("!contains") },
  { name: "NotHas", pattern: literal("!has") },
  { name: "NotIn", pattern: literal("!in") },
  
  { name: "NotStartsWith", pattern: literal("!startswith") },
  { name: "NotEndsWith", pattern: literal("!endswith") },
  { name: "NotHasPrefix", pattern: literal("!hasprefix") },
  { name: "NotHasSuffix", pattern: literal("!hassuffix") },
  
  { name: "ContainsCs", pattern: literal("contains_cs") },
  { name: "NotContainsCs", pattern: literal("!contains_cs") },
  { name: "StartsWithCs", pattern: literal("startswith_cs") },
  { name: "NotStartsWithCs", pattern: literal("!startswith_cs") },
  { name: "EndsWithCs", pattern: literal("endswith_cs") },
  { name: "NotEndsWithCs", pattern: literal("!endswith_cs") },
  { name: "HasCs", pattern: literal("has_cs") },
  { name: "NotHasCs", pattern: literal("!has_cs") },
  
  { name: "InCs", pattern: literal("in~") },
  { name: "NotInCs", pattern: literal("!in~") },
];
