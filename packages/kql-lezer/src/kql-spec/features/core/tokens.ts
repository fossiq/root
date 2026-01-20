import { FeatureEntry } from "../../feature-types";

export const coreTokensFeature: FeatureEntry = {
  id: "core.tokens",
  name: "Core tokens (identifiers, numbers, strings, operators)",
  docUrl:
    "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/scalar-data-types/",
  plugin: "core",
  status: "implemented",
  positiveExamples: [
    {
      description: "Identifier token",
      query: "Users",
    },
    {
      description: "Number literal",
      query: "StormEvents | where Magnitude > 42",
    },
    {
      description: "String literal with double quotes",
      query: 'StormEvents | where EventType == "Rain"',
    },
    {
      description: "Verbatim string with @-prefix",
      query: 'Events | where Path == @"C:\\Windows\\System32"',
    },
  ],
  negativeExamples: [
    {
      description: "Unclosed string literal",
      query: 'Events | where Name == "unclosed',
      expectError: true,
    },
  ],
};
