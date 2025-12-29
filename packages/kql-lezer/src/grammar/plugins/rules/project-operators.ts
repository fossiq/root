import {
  seq,
  ref,
  choice,
  separatedList,
  kw,
  type RuleDef,
} from "@fossiq/lezer-grammar-generator";

/**
 * Project operator rules for column selection and renaming.
 */
export const projectOperatorRules: Record<string, RuleDef> = {
  TabularOperator: {
    expression: choice(
      ref("WhereClause"),
      ref("ProjectAwayClause"),
      ref("ProjectKeepClause"),
      ref("ProjectRenameClause"),
      ref("ProjectReorderClause"),
    ),
  },

  ProjectItemList: {
    expression: separatedList(ref("Identifier"), ref("Comma"), { min: 1 }),
  },

  ProjectRenameItem: {
    expression: seq(ref("Identifier"), ref("Equals"), ref("Identifier")),
  },

  ProjectRenameList: {
    expression: separatedList(ref("ProjectRenameItem"), ref("Comma"), {
      min: 1,
    }),
  },

  ProjectAwayClause: {
    expression: seq(kw("project-away"), ref("ProjectItemList")),
  },

  ProjectKeepClause: {
    expression: seq(kw("project-keep"), ref("ProjectItemList")),
  },

  ProjectRenameClause: {
    expression: seq(kw("project-rename"), ref("ProjectRenameList")),
  },

  ProjectReorderClause: {
    expression: seq(kw("project-reorder"), ref("ProjectItemList")),
  },
};
