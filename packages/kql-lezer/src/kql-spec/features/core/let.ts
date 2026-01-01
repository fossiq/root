import { FeatureEntry } from "../../feature-types";

export const coreLetFeature: FeatureEntry = {
  id: "core.let-statement",
  name: "Let statement (variable binding)",
  docUrl:
    "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/letstatement",
  plugin: "core",
  status: "implemented",
  positiveExamples: [
    {
      description: "Let statement with number literal",
      query: "let threshold = 5; StormEvents | where Magnitude > threshold",
    },
    {
      description: "Let statement with string literal",
      query:
        'let eventType = "Rain"; StormEvents | where EventType == eventType',
    },
    {
      description: "Multiple let statements",
      query:
        "let minMag = 3; let maxMag = 7; StormEvents | where Magnitude > minMag | where Magnitude < maxMag",
    },
  ],
  negativeExamples: [
    {
      description: "Let statement missing semicolon",
      query: "let threshold = 5 StormEvents | where Magnitude > threshold",
      expectError: true,
    },
    {
      description: "Let statement missing equals",
      query: "let threshold 5; StormEvents",
      expectError: true,
    },
  ],
};
