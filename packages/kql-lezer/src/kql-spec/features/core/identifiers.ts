import { FeatureEntry } from "../../feature-types";

export const coreIdentifiersFeature: FeatureEntry = {
  id: "core.identifiers",
  name: "Identifiers (table names, column names)",
  docUrl:
    "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/schema-entities/entity-names",
  plugin: "core",
  status: "implemented",
  positiveExamples: [
    {
      description: "Simple identifier",
      query: "StormEvents",
    },
    {
      description: "Identifier with underscore",
      query: "Storm_Events",
    },
    {
      description: "Identifier starting with underscore",
      query: "_internalTable",
    },
  ],
  negativeExamples: [
    {
      description: "Identifier starting with number",
      query: "123Events",
      expectError: true,
    },
  ],
};
