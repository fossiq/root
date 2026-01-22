import "@picocss/pico";
import "./styles/theme.css";
import Layout from "./components/Layout";
import Editor from "./components/Editor";
import ResultsTable from "./components/ResultsTable";
import { SchemaProvider, useSchema } from "./contexts/SchemaContext";
import { Component, createSignal, createEffect, Show } from "solid-js";
import { kqlToDuckDB } from "@fossiq/kql-to-duckdb";

const STORAGE_KEY_QUERY = "fossiq-query";
const STORAGE_KEY_RESULTS = "fossiq-results";

const AppContent: Component = () => {
  // Load persisted query and results from localStorage
  const savedQuery = localStorage.getItem(STORAGE_KEY_QUERY) || "";
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
    <Layout
      headerContent={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            title="Run query (Ctrl+Shift+Enter)"
            onClick={handleRun}
            disabled={isRunning() || !conn()}
            style={{
              "-webkit-app-region": "no-drag",
              "app-region": "no-drag",
              padding: "0.25rem 0.75rem",
              height: "1.75rem",
              "font-size": "0.8rem",
            }}
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
            style={{
              "-webkit-app-region": "no-drag",
              "app-region": "no-drag",
              padding: "0.25rem 0.75rem",
              height: "1.75rem",
              "font-size": "0.8rem",
            }}
          >
            ✕ Clear
          </button>
        </div>
      }
      editorPane={
        <div class="editor-pane">
          <div class="editor-container">
            <Editor
              initialValue={query()}
              onChange={setQuery}
              onRun={handleRun}
            />
          </div>
        </div>
      }
      resultsPane={
        <div class="results-pane">
          <div class="pane-header">
            <div
              style={{
                display: "flex",
                "align-items": "baseline",
                gap: "1rem",
              }}
            >
              <h2>Results {results().length > 0 && `(${results().length})`}</h2>
            </div>
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
      }
    />
  );
};

export default function App() {
  return (
    <SchemaProvider>
      <AppContent />
    </SchemaProvider>
  );
}
