import { Show } from "solid-js";
import {
  appState,
  setCSVData,
  setError,
  setLoading,
  clearData,
} from "../store";
import { saveTable } from "@fossiq/kql-executor";
import { parseCSVFile } from "../utils/csvParser";

export const FileUploader = () => {
  let fileInputRef: HTMLInputElement | undefined;

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const { data, columns } = await parseCSVFile(file);
      // Use filename without extension as database name
      const dbName = file.name.replace(/\.csv$/i, "");

      // Save full data to IndexedDB
      await saveTable(dbName, data);

      // Update store (keeping data in memory for now for defaults, could optimize later)
      setCSVData(data, columns, dbName);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load CSV file";
      setError(message);
    } finally {
      if (fileInputRef) fileInputRef.value = "";
      setLoading(false);
    }
  };

  const handleLoadClick = () => {
    fileInputRef?.click();
  };

  const handleClearClick = (e: Event) => {
    e.stopPropagation();
    clearData();
  };

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      <div class="sidebar-header">Data Connections</div>

      <div
        class="data-tree-item"
        onClick={handleLoadClick}
        title="Import new CSV file"
      >
        <svg viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 11.5a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0v3h3a.5.5 0 0 1 0 1h-3v3z" />
        </svg>
        <span>Add Connection</span>
      </div>

      <Show when={appState.fileName}>
        <div class="data-tree-item" style={{ "padding-left": "24px" }}>
          <svg viewBox="0 0 16 16">
            <path d="M8 .5C3.58.5 0 1.5 0 2.5v11c0 1.09 3.58 2 8 2s8-1.09 8-2v-11c0-1-3.58-2-8-2zM8 2c2.76 0 5 .45 5 1s-2.24 1-5 1-5-.45-5-1 2.24-1 5-1z" />
          </svg>
          <span
            style={{
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "white-space": "nowrap",
            }}
          >
            {appState.fileName}
          </span>
          <span
            onClick={handleClearClick}
            style={{
              "margin-left": "auto",
              opacity: 0.5,
              "font-size": "16px",
            }}
            title="Remove"
          >
            &times;
          </span>
        </div>
      </Show>

      <Show when={appState.isLoading}>
        <div style={{ padding: "8px 16px", opacity: 0.7, "font-size": "12px" }}>
          Loading...
        </div>
      </Show>
    </div>
  );
};
