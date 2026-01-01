import type { FeatureEntry, FeatureExample } from "./feature-types";
import { coreFeatures } from "./features/core";

export type { FeatureEntry, FeatureExample };

export const featureInventory: FeatureEntry[] = [...coreFeatures];
