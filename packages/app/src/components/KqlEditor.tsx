import { createEffect, onCleanup, untrack } from "solid-js";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { setQuery, appState } from "../store";
import { placeholder } from "@codemirror/view";
import { kqlLanguage, kqlOperators, kqlFunctions, kqlKeywords } from "@fossiq/kql-language";

// Autocomplete function
const kqlCompletion = (context: CompletionContext): CompletionResult | null => {
  const word = context.matchBefore(/[\w\d_\-]+/);
  if (!word && !context.explicit) return null;

  // Gather suggestions
  const options = [
    // Tabular Operators
    ...kqlOperators.map(label => ({ label, type: "keyword", detail: "operator" })),
    // Functions
    ...kqlFunctions.map(label => ({ label, type: "function", detail: "scalar" })),
    // Keywords
    ...kqlKeywords.map(label => ({ label, type: "variable", detail: "keyword" })),
    // Current File/Table Name
    { label: appState.fileName || "T", type: "class", detail: "table" },
  ];

  // Add column names from current CSV data if available
  if (appState.csvData.length > 0) {
    const columns = Object.keys(appState.csvData[0]);
    columns.forEach(col => {
      options.push({ label: col, type: "property", detail: "column" });
      // Add quoted version if needed? For now keep simple
    });
  }

  return {
    from: word ? word.from : context.pos,
    options,
    validFor: /^[\w\d_\-]*$/,
  };
};

export const KqlEditor = () => {
  let editorContainer: HTMLDivElement | undefined;
  let editorView: EditorView | undefined;

  // Initialize editor once (re-create only if fileName changes)
  createEffect(() => {
    // Track fileName so editor refreshes placeholder if file changes
    const fileName = appState.fileName;

    if (!editorContainer) return;

    // Untrack everything else to prevent re-initialization on query/other state changes
    untrack(() => {
      // If editor already exists, destroy it first (though the effect wrapper usually handles cleanup via onCleanup if we returned it, but here we use outer var)
      if (editorView) editorView.destroy();

      const startState = EditorState.create({
        doc: appState.query, // Initial value
        extensions: [
          basicSetup,
          kqlLanguage, // Add custom KQL highlighting
          autocompletion({ override: [kqlCompletion] }), // Add KQL autocompletion
          placeholder(
            `Enter your KQL query here...\n\nExample:\n${fileName || "tablename"}\n| where Age > 25\n| project Name, Age\n| take 10`,
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newQuery = update.state.doc.toString();
              // Only update store if changed, and don't trigger re-render of THIS component
              if (newQuery !== appState.query) {
                setQuery(newQuery);
              }
            }
          }),
          EditorView.theme({
            "&": {
              height: "100%",
              backgroundColor: "transparent",
              fontSize: "14px",
            },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: '"Cascadia Code", "Fira Code", Consolas, "Courier New", monospace',
            },
            ".cm-content": {
              padding: "10px",
            },
            ".cm-placeholder": {
              color: "var(--muted-color)",
              fontStyle: "italic",
            },
          }),
        ],
      });

      editorView = new EditorView({
        state: startState,
        parent: editorContainer,
      });
    });

    onCleanup(() => {
      editorView?.destroy();
      editorView = undefined;
    });
  });

  // Sync external changes to editor (e.g. loaded file, reset)
  createEffect(() => {
    const currentQuery = appState.query;
    if (editorView && editorView.state.doc.toString() !== currentQuery) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: currentQuery,
        },
      });
    }
  });

  return (
    <div style={{ height: "100%", display: "flex", "flex-direction": "column" }}>
      <label for="kql-editor" style={{ "margin-bottom": "0.5rem", "display": "none" }}>
        <strong>Query Editor</strong>
      </label>
      <div ref={editorContainer} id="kql-editor" style={{ height: "100%" }} />
    </div>
  );
};
