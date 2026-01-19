import { FeatureEntry } from "../../feature-types";

export const corePipelineFeature: FeatureEntry = {
  id: "core.pipe",
  name: "Pipeline operator (pipe |)",
  docUrl: "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/",
  plugin: "core",
  status: "implemented",
  positiveExamples: [
    {
      description: "Simple pipeline with one stage",
      query: 'StormEvents | where EventType == "Rain"',
    },
    {
      description: "Pipeline with multiple stages",
      query: 'StormEvents | where EventType == "Rain" | where Magnitude > 5',
    },
    {
      description: "Three-stage pipeline",
      query:
        'Events | where Level == "Error" | where Timestamp > datetime(2024-01-01) | where Source == "App"',
    },
  ],
  negativeExamples: [
    {
      description: "Trailing pipe without operator",
      query: "StormEvents |",
      expectError: true,
    },
    {
      description: "Double pipe",
      query: 'StormEvents || where EventType == "Rain"',
      expectError: true,
    },
  ],
};
