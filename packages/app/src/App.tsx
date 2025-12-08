import { Show } from "solid-js";
import { appState, setQueryResults, setError } from "./store";
import { FileUploader } from "./components/FileUploader";
import { KqlEditor } from "./components/KqlEditor";
import { ResultsTable } from "./components/ResultsTable";
import { executeKQLQuery } from "@fossiq/kql-executor";

function App() {
  const handleExecuteQuery = async () => {
    try {
      setError(null);
      if (appState.csvData.length === 0) {
        setError("No data loaded. Please load a CSV file first.");
        return;
      }

      if (!appState.query.trim()) {
        setError("Please enter a query.");
        return;
      }

      const results = await executeKQLQuery(
        appState.query,
        appState.fileName || "table",
      );
      setQueryResults(results);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to execute query";
      setError(message);
      setQueryResults(null);
    }
  };

  return (
    <div class="adx-layout">
      {/* Sidebar */}
      <aside class="adx-sidebar">
        <div
          class="sidebar-header"
          style={{
            "font-size": "16px",
            "text-transform": "none",
            "margin-bottom": "10px",
            color: "var(--ade-text-active)",
          }}
        >
          Expedition
        </div>
        <FileUploader />
      </aside>

      {/* Main Content Area */}
      <main class="adx-main">
        {/* Toolbar */}
        <header class="adx-toolbar">
          <button
            class="adx-btn"
            onClick={handleExecuteQuery}
            disabled={appState.csvData.length === 0}
          >
            <svg viewBox="0 0 16 16" style={{ width: "16px", height: "16px" }}>
              <path
                fill="currentColor"
                d="M4 12V4l8 4-8 4z" /* Play icon simple */
              />
            </svg>
            Run
          </button>
        </header>

        {/* Content Split: Top (Query) / Bottom (Results) */}
        <div class="adx-content-split">
          {/* Top: Query Editor */}
          <section class="adx-query-panel">
            <Show when={appState.error}>
              <div
                style={{
                  padding: "8px 16px",
                  "background-color": "#4e1b1b",
                  color: "#ffcccc",
                  "font-size": "12px",
                  "border-bottom": "1px solid var(--ade-border)",
                }}
              >
                {appState.error}
              </div>
            </Show>
            <KqlEditor />
            {/* If we needed a query status bar, it would go here */}
          </section>

          {/* Bottom: Results */}
          <section class="adx-results-panel">
            <Show when={appState.queryResults !== null} fallback={
              <div style={{ padding: "2rem", color: "var(--ade-text)", opacity: 0.5, "text-align": "center" }}>
                Execute a query to see results
              </div>
            }>
              <div style={{ flex: "1", overflow: "hidden", display: "flex", "flex-direction": "column" }}>
                <div style={{ padding: "8px 16px", "border-bottom": "1px solid var(--ade-border)", "font-size": "12px", "font-weight": "600" }}>
                  Query Results
                </div>
                <div style={{ flex: "1", overflow: "auto" }}>
                  <ResultsTable />
                </div>
              </div>
            </Show>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
