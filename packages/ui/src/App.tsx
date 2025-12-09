import "@picocss/pico";
import "./styles/theme.css";
import Layout from "./components/Layout";
import Editor from "./components/Editor";
import ResultsTable from "./components/ResultsTable";
import { SchemaProvider, useSchema } from "./contexts/SchemaContext";
import { Component, createSignal, onMount, Show } from "solid-js";
import { kqlToDuckDB, initParser } from "@fossiq/kql-to-duckdb";

const AppContent: Component = () => {
  const [query, setQuery] = createSignal("Events | take 10");
  const [results, setResults] = createSignal<any[]>([]);
  const [error, setError] = createSignal<string | null>(null);
  const [isRunning, setIsRunning] = createSignal(false);
  const { conn } = useSchema();

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
