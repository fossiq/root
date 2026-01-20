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
