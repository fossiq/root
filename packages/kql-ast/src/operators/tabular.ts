import type { AsOperator } from "./as";
import type { DatatableOperator } from "./datatable";
import type { EvaluateOperator } from "./evaluate";
import type { GetSchemaOperator } from "./schema";
import type { JoinOperator } from "./join";
import type { MakeSeriesOperator } from "./make-series";
import type { ParseOperator } from "./parse";
import type { PartitionOperator } from "./partition";
import type { PrintOperator } from "./print";
import type {
  ExtendOperator,
  ProjectAwayOperator,
  ProjectKeepOperator,
  ProjectOperator,
  ProjectRenameOperator,
  ProjectReorderOperator,
} from "./project";
import type { RenderOperator } from "./render";
import type { SampleOperator } from "./sample";
import type { SerializeOperator } from "./serialize";
import type { SortOperator, LimitOperator, TakeOperator, TopOperator } from "./sort";
import type { DistinctOperator, SummarizeOperator, MvExpandOperator } from "./aggregate";
import type { UnionOperator } from "./union";
import type { WhereOperator } from "./where";

export type TabularOperator =
  | WhereOperator
  | ProjectOperator
  | ProjectAwayOperator
  | ProjectKeepOperator
  | ProjectRenameOperator
  | ProjectReorderOperator
  | ExtendOperator
  | SortOperator
  | LimitOperator
  | TakeOperator
  | TopOperator
  | DistinctOperator
  | SummarizeOperator
  | MvExpandOperator
  | UnionOperator
  | JoinOperator
  | ParseOperator
  | EvaluateOperator
  | MakeSeriesOperator
  | PartitionOperator
  | SampleOperator
  | GetSchemaOperator
  | RenderOperator
  | SerializeOperator
  | AsOperator
  | DatatableOperator
  | PrintOperator;
