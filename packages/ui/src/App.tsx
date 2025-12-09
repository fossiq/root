import "@picocss/pico";
import "./styles/theme.css";
import Layout from "./components/Layout";
import Editor from "./components/Editor";
import ResultsTable from "./components/ResultsTable";
import { SchemaProvider, useSchema } from "./contexts/SchemaContext";
import { Component, createSignal, createEffect, onMount, Show } from "solid-js";
import { kqlToDuckDB, initParser } from "@fossiq/kql-to-duckdb";

const STORAGE_KEY_QUERY = "fossiq-query";
const STORAGE_KEY_RESULTS = "fossiq-results";

const AppContent: Component = () => {
  // Load persisted query and results from localStorage
  const savedQuery =
    localStorage.getItem(STORAGE_KEY_QUERY) || "Events | take 10";
  const savedResults = (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESULTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const [query, setQuery] = createSignal(savedQuery);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Query results have dynamic schema based on user query
  const [results, setResults] = createSignal<any[]>(savedResults);
  const [error, setError] = createSignal<string | null>(null);
  const [isRunning, setIsRunning] = createSignal(false);
  const { conn } = useSchema();

  // Persist query to localStorage when it changes
  createEffect(() => {
    localStorage.setItem(STORAGE_KEY_QUERY, query());
  });

  // Persist results to localStorage when they change
  createEffect(() => {
    const currentResults = results();
    if (currentResults.length > 0) {
      // Convert BigInt to Number for JSON serialization
      const serializable = JSON.stringify(currentResults, (_, value) =>
        typeof value === "bigint" ? Number(value) : value
      );
      localStorage.setItem(STORAGE_KEY_RESULTS, serializable);
    }
  });

  onMount(async () => {
    try {
      await initParser("/tree-sitter-kql.wasm", "/tree-sitter.wasm");
      console.log("KQL Parser initialized");
    } catch (e) {
      console.error("Failed to initialize KQL Parser", e);
      setError("Failed to initialize parser. Check console.");
    }
  });

  const handleRun = async () => {
    const connection = conn();
    if (!connection) {
      setError("Database not initialized yet.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults([]);

    try {
      console.log("Translating KQL:", query());
      const sql = kqlToDuckDB(query());
      console.log("Executing SQL:", sql);

      const result = await connection.query(sql);
      // result.toArray() returns Arrow Rows. toJSON() converts to plain object.
      const rows = result.toArray().map((row) => row.toJSON());
      console.log("Query Results:", rows);
      setResults(rows);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Error can be any type from DuckDB or KQL translation
    } catch (err: any) {
      console.error("Query Error:", err);
      setError(err.message || String(err));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Layout>
      <div class="panes-container">
        <div class="editor-pane">
          <div class="pane-header">
            <h2>Query</h2>
            <div class="pane-actions">
              <button
                title="Run query (Ctrl+Shift+Enter)"
                onClick={handleRun}
                disabled={isRunning() || !conn()}
              >
                {isRunning() ? "Running..." : "▶ Run"}
              </button>
              <button
                class="secondary"
                title="Clear results"
                onClick={() => {
                  setResults([]);
                  setError(null);
                  localStorage.removeItem(STORAGE_KEY_RESULTS);
                }}
              >
                ✕ Clear
              </button>
            </div>
          </div>
          <div class="editor-container">
            <Editor
              initialValue={query()}
              onChange={setQuery}
              onRun={handleRun}
            />
          </div>
        </div>
        <div class="results-pane">
          <div class="pane-header">
            <h2>Results {results().length > 0 && `(${results().length})`}</h2>
          </div>
          <Show when={error()}>
            <div
              style={{
                padding: "1rem",
                color: "#d32f2f",
                "background-color": "#ffebee",
              }}
            >
              <strong>Error:</strong> {error()}
            </div>
          </Show>
          <ResultsTable data={results()} />
        </div>
      </div>
    </Layout>
  );
};

export default function App() {
  return (
    <SchemaProvider>
      <AppContent />
    </SchemaProvider>
  );
}
