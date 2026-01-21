import type {
  TabularOperator,
  WhereOperator,
  ProjectOperator,
  ProjectAwayOperator,
  ProjectKeepOperator,
  ProjectRenameOperator,
  ProjectReorderOperator,
  ExtendOperator,
  SortOperator,
  LimitOperator,
  TakeOperator,
  TopOperator,
  DistinctOperator,
  SummarizeOperator,
  JoinOperator,
  UnionOperator,
  MvExpandOperator,
  PipelineExpression,
} from "@fossiq/kql-ast";

import { translateWhere } from "./where";
import {
  translateProject,
  translateProjectAway,
  translateProjectKeep,
  translateProjectRename,
  translateProjectReorder,
  translateExtend,
} from "./project";
import { translateSummarize } from "./aggregate";
import {
  translateSort,
  translateLimit,
  translateTake,
  translateTop,
  translateDistinct,
} from "./sort-limit";
import {
  translateJoin,
  translateUnion,
  translateMvExpand,
  setTranslatePipelineRef as setJoinUnionPipelineRef,
} from "./join-union";

export function translateOperator(
  operator: TabularOperator,
  inputRelation: string
): string {
  switch (operator.type) {
    case "WhereOperator":
      return translateWhere(operator as WhereOperator, inputRelation);
    case "ProjectOperator":
      return translateProject(operator as ProjectOperator, inputRelation);
    case "ProjectAwayOperator":
      return translateProjectAway(
        operator as ProjectAwayOperator,
        inputRelation
      );
    case "ProjectKeepOperator":
      return translateProjectKeep(
        operator as ProjectKeepOperator,
        inputRelation
      );
    case "ProjectRenameOperator":
      return translateProjectRename(
        operator as ProjectRenameOperator,
        inputRelation
      );
    case "ProjectReorderOperator":
      return translateProjectReorder(
        operator as ProjectReorderOperator,
        inputRelation
      );
    case "ExtendOperator":
      return translateExtend(operator as ExtendOperator, inputRelation);
    case "SortOperator":
      return translateSort(operator as SortOperator, inputRelation);
    case "LimitOperator":
      return translateLimit(operator as LimitOperator, inputRelation);
    case "TakeOperator":
      return translateTake(operator as TakeOperator, inputRelation);
    case "TopOperator":
      return translateTop(operator as TopOperator, inputRelation);
    case "DistinctOperator":
      return translateDistinct(operator as DistinctOperator, inputRelation);
    case "SummarizeOperator":
      return translateSummarize(operator as SummarizeOperator, inputRelation);
    case "JoinOperator":
      return translateJoin(operator as JoinOperator, inputRelation);
    case "UnionOperator":
      return translateUnion(operator as UnionOperator, inputRelation);
    case "MvExpandOperator":
      return translateMvExpand(operator as MvExpandOperator, inputRelation);
    default:
      throw new Error(
        `Unsupported operator: ${
          (operator as TabularOperator & { type: string }).type
        }`
      );
  }
}

export function setTranslatePipelineRef(
  fn: (pipeline: PipelineExpression) => string
) {
  setJoinUnionPipelineRef(fn);
}
