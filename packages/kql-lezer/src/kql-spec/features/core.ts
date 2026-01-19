import { FeatureEntry } from "../feature-types";
import { coreTokensFeature } from "./core/tokens";
import { coreIdentifiersFeature } from "./core/identifiers";
import { corePipelineFeature } from "./core/pipeline";
import { coreLetFeature } from "./core/let";
import { coreWhereFeature } from "./core/where";
import { coreArithmeticFeature } from "./core/arithmetic";
import { coreComparisonFeature } from "./core/comparison";

export const coreFeatures: FeatureEntry[] = [
  coreTokensFeature,
  coreIdentifiersFeature,
  corePipelineFeature,
  coreLetFeature,
  coreWhereFeature,
  coreArithmeticFeature,
  coreComparisonFeature,
];
