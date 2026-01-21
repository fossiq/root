import type {
  ProjectOperator,
  ProjectColumn,
  ProjectAwayOperator,
  ProjectKeepOperator,
  ProjectRenameOperator,
  ProjectReorderOperator,
  ExtendOperator,
} from "@fossiq/kql-ast";
import { translateExpression } from "../expressions";

export function translateProject(
  operator: ProjectOperator,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateProjectColumn).join(", ");
  return `SELECT ${columns} FROM ${inputRelation}`;
}

export function translateProjectColumn(col: ProjectColumn): string {
  const expr = translateExpression(col.expression);
  if (col.alias) {
    return `${expr} AS ${col.alias}`;
  }
  return expr;
}

export function translateProjectAway(
  operator: ProjectAwayOperator,
  inputRelation: string
): string {
  const columnsToRemove = operator.columns.join(", ");
  return `SELECT * EXCLUDE (${columnsToRemove}) FROM ${inputRelation}`;
}

export function translateProjectKeep(
  operator: ProjectKeepOperator,
  inputRelation: string
): string {
  const columns = operator.columns.join(", ");
  return `SELECT ${columns} FROM ${inputRelation}`;
}

export function translateProjectRename(
  operator: ProjectRenameOperator,
  inputRelation: string
): string {
  const renames = operator.renames
    .map(
      (r: { newName: string; oldName: string }) =>
        `${r.oldName} AS ${r.newName}`
    )
    .join(", ");
  return `SELECT * REPLACE (${renames}) FROM ${inputRelation}`;
}

export function translateProjectReorder(
  operator: ProjectReorderOperator,
  inputRelation: string
): string {
  const columns = operator.columns.join(", ");
  return `SELECT ${columns}, * EXCLUDE (${columns}) FROM ${inputRelation}`;
}

export function translateExtend(
  operator: ExtendOperator,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateProjectColumn).join(", ");
  return `SELECT *, ${columns} FROM ${inputRelation}`;
}
