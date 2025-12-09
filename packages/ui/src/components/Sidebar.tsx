import { Component, For, Show } from "solid-js";
import Icon from "./Icon";
import { useSchema } from "../contexts/SchemaContext";

interface SidebarProps {
  onAddSource?: () => void;
}

const Sidebar: Component<SidebarProps> = (_props) => {
  const {
    tables,
    addTable,
    removeTable,
    loading,
    pendingRestoreCount,
    restorePendingFiles,
  } = useSchema();

  const handleFileSelect = async () => {
    try {
      // @ts-expect-error - File System Access API types might not be fully available
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "CSV Files",
            accept: {
              "text/csv": [".csv"],
            },
          },
        ],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      await addTable(file, fileHandle);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name !== "AbortError") {
        console.error("Error selecting file:", err);
        // Fallback to standard input if showOpenFilePicker fails or isn't supported
        // Note: Files selected via input element cannot be persisted across page reloads
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv";
        input.onchange = async (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            await addTable(files[0]);
          }
        };
        input.click();
      }
    }
  };

  return (
    <aside class="sidebar" role="navigation" aria-label="Sources panel">
      <button
        onClick={handleFileSelect}
        title="Add data source"
        aria-label="Add data source"
        class="add-source-btn"
        disabled={loading()}
      >
        <Show when={!loading()} fallback={<span>Loading...</span>}>
          <Icon name="plus-circle" size={20} />
          <span>Add Data</span>
        </Show>
      </button>

      <Show when={pendingRestoreCount() > 0}>
        <button
          onClick={restorePendingFiles}
          class="restore-btn"
          disabled={loading()}
        >
          Restore {pendingRestoreCount()} file
          {pendingRestoreCount() > 1 ? "s" : ""}
        </button>
      </Show>

      <div class="tables-list">
        <Show when={tables().length === 0}>
          <div class="empty-state">
            <p>No data loaded</p>
            <small>Click "Add Data" to load a CSV file</small>
          </div>
        </Show>
        <For each={tables()}>
          {(table) => (
            <div class="table-item">
              <div class="table-header">
                <Icon name="table" size={16} class="type-icon" />
                <span class="table-name" title={table.name}>
                  {table.name}
                </span>
                <span class="row-count">({table.rowCount})</span>
                <button
                  class="remove-table-btn"
                  onClick={() => removeTable(table.name)}
                  title={`Remove ${table.name}`}
                  disabled={loading()}
                >
                  <Icon name="x-circle" size={16} />
                </button>
              </div>
              <div class="columns-list">
                <For each={table.columns}>
                  {(column, index) => {
                    const isLast = index() === table.columns.length - 1;
                    return (
                      <div
                        class="column-item"
                        title={`${column.name} (${column.type})`}
                      >
                        <span class="tree-glyph">{isLast ? "└─" : "├─"}</span>
                        <Icon name="column" size={12} class="column-icon" />
                        <span class="column-name">{column.name}</span>
                        <span class="column-type">{column.type}</span>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </aside>
  );
};

export default Sidebar;
