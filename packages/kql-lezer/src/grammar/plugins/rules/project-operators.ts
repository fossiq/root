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
  ProjectClause: {
    expression: seq(kw("project"), ref("ProjectExpressionList")),
  },

  ProjectExpressionList: {
    expression: separatedList(ref("ProjectExpressionItem"), ref("Comma"), { min: 1 }),
  },

  ProjectExpressionItem: {
    expression: choice(
        seq(ref("Identifier"), ref("Equals"), ref("Expression")),
        ref("Expression")
    )
  },

  IdentifierList: {
      expression: separatedList(ref("Identifier"), ref("Comma"), { min: 1 })
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
    expression: seq(ref("ProjectAway"), ref("IdentifierList")),
  },

  ProjectKeepClause: {
    expression: seq(ref("ProjectKeep"), ref("IdentifierList")),
  },

  ProjectRenameClause: {
    expression: seq(ref("ProjectRename"), ref("ProjectRenameList")),
  },

  ProjectReorderClause: {
    expression: seq(ref("ProjectReorder"), ref("IdentifierList")),
  },
};
