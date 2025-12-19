export interface FeatureExample {
    description: string;
    query: string;
    expectError?: boolean;
}

export interface FeatureEntry {
    id: string;
    name: string;
    docUrl: string;
    plugin: string;
    status: "planned" | "in-progress" | "blocked" | "implemented" | "verified";
    prerequisites?: string[];
    positiveExamples: FeatureExample[];
    negativeExamples: FeatureExample[];
    notes?: string;
}

export const featureInventory: FeatureEntry[] = [
    {
        id: "core.tokens",
        name: "Core tokens (identifiers, numbers, strings, operators)",
        docUrl: "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/scalar-data-types/",
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
    },
    {
        id: "core.identifiers",
        name: "Identifiers (table names, column names)",
        docUrl: "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/schema-entities/entity-names",
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
    },
    {
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
                query: 'Events | where Level == "Error" | where Timestamp > datetime(2024-01-01) | where Source == "App"',
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
    },
    {
        id: "core.let-statement",
        name: "Let statement (variable binding)",
        docUrl: "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/letstatement",
        plugin: "core",
        status: "implemented",
        positiveExamples: [
            {
                description: "Let statement with number literal",
                query: "let threshold = 5; StormEvents | where Magnitude > threshold",
            },
            {
                description: "Let statement with string literal",
                query: 'let eventType = "Rain"; StormEvents | where EventType == eventType',
            },
            {
                description: "Multiple let statements",
                query: "let minMag = 3; let maxMag = 7; StormEvents | where Magnitude > minMag | where Magnitude < maxMag",
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
    },
    {
        id: "operator.where",
        name: "Where operator (filtering)",
        docUrl: "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/whereoperator",
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
    },
    {
        id: "scalar.arithmetic",
        name: "Arithmetic expressions (+, -, *, /, %)",
        docUrl: "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/numoperators",
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
    },
    {
        id: "scalar.comparison",
        name: "Comparison operators (==, !=, <, >, <=, >=)",
        docUrl: "https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/datatypes-string-operators",
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
    },
];
