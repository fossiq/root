import { literal, type TokenDef } from "@fossiq/lezer-grammar-generator";

/**
 * Special keyword tokens for KQL that require exact matching.
 * These are multi-word operators or operators with special characters.
 */
export const keywordTokens: TokenDef[] = [
    // Multi-word project operators
    { name: "ProjectAway", pattern: literal("project-away") },
    { name: "ProjectKeep", pattern: literal("project-keep") },
    { name: "ProjectRename", pattern: literal("project-rename") },
    { name: "ProjectReorder", pattern: literal("project-reorder") },

    // Multi-word other operators
    { name: "MvExpand", pattern: literal("mv-expand") },

    // Special operators
    { name: "RangeDoubleDot", pattern: literal("..") },
    { name: "NotBetween", pattern: literal("!between") },
    { name: "NotContains", pattern: literal("!contains") },
    { name: "NotHas", pattern: literal("!has") },
    { name: "NotIn", pattern: literal("!in") },
];
