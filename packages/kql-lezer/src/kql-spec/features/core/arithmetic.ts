import { FeatureEntry } from "../../feature-types";

export const coreArithmeticFeature: FeatureEntry = {
  id: "scalar.arithmetic",
  name: "Arithmetic expressions (+, -, *, /, %)",
  docUrl:
    "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/numoperators",
  plugin: "core",
  status: "implemented",
  positiveExamples: [
    {
      description: "Addition",
      query: "StormEvents | where Magnitude + 2 > 5",
    },
    {
      description: "Subtraction",
      query: "Events | where Count - 1 == 0",
    },
    {
      description: "Multiplication",
      query: "Metrics | where Value * 2 > 100",
    },
    {
      description: "Division",
      query: "Stats | where Total / 10 > 5",
    },
    {
      description: "Modulo",
      query: "Numbers | where Value % 2 == 0",
    },
    {
      description: "Complex arithmetic expression",
      query: "Data | where (Value + 10) * 2 / 5 > Threshold",
    },
  ],
  negativeExamples: [
    {
      description: "Operator without right operand",
      query: "Events | where Count +",
      expectError: true,
    },
  ],
};
