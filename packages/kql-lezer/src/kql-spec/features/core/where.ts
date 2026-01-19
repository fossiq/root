import { FeatureEntry } from "../../feature-types";

export const coreWhereFeature: FeatureEntry = {
  id: "operator.where",
  name: "Where operator (filtering)",
  docUrl:
    "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/whereoperator",
  plugin: "core",
  status: "implemented",
  positiveExamples: [
    {
      description: "Where with comparison operator",
      query: "StormEvents | where Magnitude > 5",
    },
    {
      description: "Where with equality comparison",
      query: 'StormEvents | where EventType == "Rain"',
    },
    {
      description: "Where with inequality",
      query: 'Events | where Level != "Info"',
    },
    {
      description: "Chained where clauses",
      query: 'StormEvents | where Magnitude > 3 | where EventType == "Storm"',
    },
  ],
  negativeExamples: [
    {
      description: "Where without expression",
      query: "StormEvents | where",
      expectError: true,
    },
    {
      description: "Where with invalid operator position",
      query: "StormEvents | where > 5",
      expectError: true,
    },
  ],
};
