import "@picocss/pico";
import "./styles/theme.css";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Layout>
      <div class="panes-container">
        <div class="editor-pane">
          <div class="pane-header">
            <h2>Query Editor</h2>
          </div>
          <div class="toolbar">
            <button title="Run query (Ctrl+Shift+Enter)">▶ Run</button>
            <button title="Clear results">✕ Clear</button>
          </div>
          <div class="editor-container">
            <p style={{ color: "var(--text-secondary)" }}>
              CodeMirror editor will be integrated here
            </p>
          </div>
        </div>
        <div class="results-pane">
          <div class="pane-header">
            <h2>Results</h2>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                  <th>Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>
                  <td>Data 3</td>
                </tr>
                <tr>
                  <td>Data 4</td>
                  <td>Data 5</td>
                  <td>Data 6</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
