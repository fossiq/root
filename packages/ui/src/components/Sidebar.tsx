import { Component, For, Show } from "solid-js";
import Icon from "./Icon";
import { useSchema } from "../contexts/SchemaContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  onAddSource?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: Component<SidebarProps> = (props) => {
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
    <aside
      class={styles.sidebar}
      classList={{ [styles.collapsed]: props.collapsed }}
      role="navigation"
      aria-label="Sources panel"
    >
      <div class={styles.sidebarInner}>
        <div class={styles.sidebarHeader}>
          <div class={styles.sidebarHeaderCol1}>
            <button
              onClick={props.onToggleCollapse}
              title={props.collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={
                props.collapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              class={styles.collapseToggleBtn}
            >
              <Icon
                name={
                  props.collapsed ? "sidebar-collapsed" : "sidebar-expanded"
                }
                size={20}
              />
            </button>
          </div>
          <div class={styles.sidebarHeaderCol2}>
            <button
              onClick={handleFileSelect}
              title="Add data source"
              aria-label="Add data source"
              class={styles.addSourceBtn}
              disabled={loading()}
            >
              <Show when={!loading()} fallback={<span>Loading...</span>}>
                <Icon name="plus-circle" size={20} />
                <span>Add Data</span>
              </Show>
            </button>
          </div>
        </div>

        <Show when={pendingRestoreCount() > 0}>
          <button
            onClick={restorePendingFiles}
            class={styles.restoreBtn}
            disabled={loading()}
          >
            Restore {pendingRestoreCount()} file
            {pendingRestoreCount() > 1 ? "s" : ""}
          </button>
        </Show>

        <div class={styles.tablesList}>
          <Show when={tables().length === 0}>
            <div class={styles.emptyState}>
              <p>No data loaded</p>
              <small>Click "Add Data" to load a CSV file</small>
            </div>
          </Show>
          <For each={tables()}>
            {(table) => (
              <div class={styles.tableItem}>
                <div class={styles.tableHeader}>
                  <div class={styles.tableHeaderCol1}>
                    <span class={styles.tableEmoji} title={table.name}>
                      {table.emoji}
                    </span>
                  </div>
                  <div class={styles.tableHeaderCol2}>
                    <span class={styles.tableName} title={table.name}>
                      {table.name}
                    </span>
                    <span class={styles.rowCount}>({table.rowCount})</span>
                    <button
                      class={styles.removeTableBtn}
                      onClick={() => removeTable(table.name)}
                      title={`Remove ${table.name}`}
                      disabled={loading()}
                    >
                      <Icon name="x-circle" size={16} />
                    </button>
                  </div>
                </div>
                <div class={styles.columnsList}>
                  <For each={table.columns}>
                    {(column, index) => {
                      const isLast = index() === table.columns.length - 1;
                      return (
                        <div
                          class={styles.columnItem}
                          title={`${column.name} (${column.type})`}
                        >
                          <span class={styles.treeGlyph}>
                            {isLast ? "└─" : "├─"}
                          </span>
                          <Icon
                            name="column"
                            size={12}
                            class={styles.columnIcon}
                          />
                          <span class={styles.columnName}>{column.name}</span>
                          <span class={styles.columnType}>{column.type}</span>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
