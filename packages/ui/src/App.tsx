import "@picocss/pico";
import "./styles/theme.css";
import Layout from "./components/Layout";
import Editor from "./components/Editor";
import ResultsTable from "./components/ResultsTable";
import { SchemaProvider, useSchema } from "./contexts/SchemaContext";
import { Component, createSignal, createEffect, Show } from "solid-js";
import { kqlToDuckDB } from "@fossiq/kql-to-duckdb";
import { PaginationState, OnChangeFn } from "@tanstack/solid-table";

const STORAGE_KEY_QUERY = "fossiq-query";
const STORAGE_KEY_RESULTS = "fossiq-results";
const STORAGE_KEY_PAGE_INDEX = "fossiq-results-page-index";
const STORAGE_KEY_PAGE_SIZE = "fossiq-results-page-size";

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

  // Pagination state
  const [pagination, setPagination] = createSignal<PaginationState>({
    pageIndex: Number(localStorage.getItem(STORAGE_KEY_PAGE_INDEX)) || 0,
    pageSize: Number(localStorage.getItem(STORAGE_KEY_PAGE_SIZE)) || 50,
  });

  const onPaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
    setPagination((old) => {
      const newState =
        typeof updaterOrValue === "function"
          ? updaterOrValue(old)
          : updaterOrValue;
      return newState;
    });
  };

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

  // Persist pagination state
  createEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_PAGE_INDEX,
      String(pagination().pageIndex)
    );
    localStorage.setItem(STORAGE_KEY_PAGE_SIZE, String(pagination().pageSize));
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
    // Reset to first page on new run
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

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

  const totalPages = () => Math.ceil(results().length / pagination().pageSize);

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
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
            <h2>Results {results().length > 0 && `(${results().length})`}</h2>
            <Show when={results().length > 0}>
              <div
                class="pagination-controls"
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  "align-items": "center",
                  "margin-left": "auto",
                }}
              >
                <button
                  class="outline"
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: Math.max(0, p.pageIndex - 1),
                    }))
                  }
                  disabled={pagination().pageIndex === 0}
                  style={{
                    padding: "0.25rem 0.5rem",
                    "font-size": "0.8rem",
                    height: "auto",
                  }}
                >
                  Prev
                </button>
                <span style={{ "font-size": "0.8rem" }}>
                  Page {pagination().pageIndex + 1} of {totalPages() || 1}
                </span>
                <button
                  class="outline"
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: Math.min(totalPages() - 1, p.pageIndex + 1),
                    }))
                  }
                  disabled={pagination().pageIndex >= totalPages() - 1}
                  style={{
                    padding: "0.25rem 0.5rem",
                    "font-size": "0.8rem",
                    height: "auto",
                  }}
                >
                  Next
                </button>
              </div>
            </Show>
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
          <ResultsTable
            data={results()}
            pagination={pagination()}
            onPaginationChange={onPaginationChange}
          />
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
