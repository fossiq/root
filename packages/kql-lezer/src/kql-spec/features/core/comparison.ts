import { FeatureEntry } from "../../feature-types";

export const coreComparisonFeature: FeatureEntry = {
  id: "scalar.comparison",
  name: "Comparison operators (==, !=, <, >, <=, >=)",
  docUrl:
    "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/datatypes-string-operators",
  plugin: "core",
  status: "implemented",
  positiveExamples: [
    {
      description: "Equality",
      query: 'Events | where Status == "Active"',
    },
    {
      description: "Inequality",
      query: 'Events | where Status != "Inactive"',
    },
    {
      description: "Less than",
      query: "Metrics | where Value < 100",
    },
    {
      description: "Greater than",
      query: "Metrics | where Value > 50",
    },
    {
      description: "Less than or equal",
      query: "Metrics | where Value <= 100",
    },
    {
      description: "Greater than or equal",
      query: "Metrics | where Value >= 50",
    },
  ],
  negativeExamples: [
    {
      description: "Comparison without right operand",
      query: "Events | where Status ==",
      expectError: true,
    },
  ],
};
