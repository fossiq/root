import { Component, For, createMemo, createSignal, Show } from "solid-js";
import {
  createSolidTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getSortedRowModel,
  SortingState,
} from "@tanstack/solid-table";
import { createVirtualizer } from "@tanstack/solid-virtual";

interface ResultsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Query results have dynamic schema based on user query
  data: any[];
}

interface TooltipState {
  content: string;
  x: number;
  y: number;
}

const ResultsTable: Component<ResultsTableProps> = (props) => {
  const [sorting, setSorting] = createSignal<SortingState>([]);
  const [tooltip, setTooltip] = createSignal<TooltipState | null>(null);
  let parentRef: HTMLDivElement | undefined;

  const MAX_COLUMN_WIDTH = 250;

  // Dynamically generate columns based on the first item in data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Column definitions are generic for dynamic query results
  const columns = createMemo<ColumnDef<any>[]>(() => {
    if (!props.data || props.data.length === 0) return [];
    const firstItem = props.data[0];
    return Object.keys(firstItem).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => info.getValue(),
    }));
  });

  const table = createSolidTable({
    get data() {
      return props.data;
    },
    get columns() {
      return columns();
    },
    state: {
      get sorting() {
        return sorting();
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Use createMemo to reactively get rows and headers when data changes
  const rows = createMemo(() => table.getRowModel().rows);
  const headerGroups = createMemo(() => table.getHeaderGroups());

  const rowVirtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => parentRef ?? null,
    estimateSize: () => 35,
    overscan: 10,
  });

  const virtualItems = () => rowVirtualizer.getVirtualItems();
  const totalSize = () => rowVirtualizer.getTotalSize();

  const handleCellClick = (e: MouseEvent, value: unknown) => {
    const target = e.currentTarget as HTMLElement;
    const stringValue = String(value ?? "");

    // Check if text is actually overflowing
    if (target.scrollWidth <= target.clientWidth) {
      return;
    }

    const currentTooltip = tooltip();
    // Toggle off if clicking the same cell
    if (currentTooltip && currentTooltip.content === stringValue) {
      setTooltip(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setTooltip({
      content: stringValue,
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  const closeTooltip = () => setTooltip(null);

  return (
    <div
      ref={parentRef}
      class="table-container"
      style={{
        height: "100%",
        overflow: "auto",
        position: "relative",
      }}
      onClick={(e) => {
        // Close tooltip when clicking outside cells
        if (!(e.target as HTMLElement).closest("td")) {
          closeTooltip();
        }
      }}
    >
      <table style={{ width: "100%", "border-collapse": "collapse" }}>
        <thead
          style={{
            position: "sticky",
            top: 0,
            "z-index": 1,
            background: "var(--bg-secondary)",
          }}
        >
          <For each={headerGroups()}>
            {(headerGroup) => (
              <tr>
                <For each={headerGroup.headers}>
                  {(header) => (
                    <th
                      style={{
                        padding: "0.5rem 1rem",
                        "font-weight": "bold",
                        "white-space": "nowrap",
                        "text-align": "left",
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                        "border-bottom": "1px solid var(--border-color)",
                        "min-width": "100px",
                        "max-width": `${MAX_COLUMN_WIDTH}px`,
                        overflow: "hidden",
                        "text-overflow": "ellipsis",
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </th>
                  )}
                </For>
              </tr>
            )}
          </For>
        </thead>
        <tbody>
          {/* Spacer row for virtual scroll offset */}
          {virtualItems().length > 0 && (
            <tr>
              <td
                style={{ height: `${virtualItems()[0]?.start ?? 0}px` }}
                colspan={headerGroups()[0]?.headers.length || 1}
              />
            </tr>
          )}
          <For each={virtualItems()}>
            {(virtualRow) => {
              const row = rows()[virtualRow.index];
              const isEven = virtualRow.index % 2 === 0;
              return (
                <tr
                  style={{
                    height: `${virtualRow.size}px`,
                    "background-color": isEven
                      ? "var(--bg-primary)"
                      : "var(--bg-secondary)",
                  }}
                >
                  <For each={row.getVisibleCells()}>
                    {(cell) => {
                      const value = cell.getValue();
                      return (
                        <td
                          style={{
                            padding: "0.5rem 1rem",
                            "white-space": "nowrap",
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "max-width": `${MAX_COLUMN_WIDTH}px`,
                            cursor: "pointer",
                          }}
                          onClick={(e) => handleCellClick(e, value)}
                          title=""
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    }}
                  </For>
                </tr>
              );
            }}
          </For>
          {/* Spacer row for remaining virtual scroll space */}
          {virtualItems().length > 0 && (
            <tr>
              <td
                style={{
                  height: `${
                    totalSize() -
                    (virtualItems()[virtualItems().length - 1]?.end ?? 0)
                  }px`,
                }}
                colspan={headerGroups()[0]?.headers.length || 1}
              />
            </tr>
          )}
        </tbody>
      </table>

      {/* Persistent tooltip */}
      <Show when={tooltip()}>
        {(t) => (
          <div
            style={{
              position: "fixed",
              left: `${t().x}px`,
              top: `${t().y}px`,
              "max-width": "400px",
              "max-height": "200px",
              overflow: "auto",
              padding: "0.75rem",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              "border-radius": "4px",
              "box-shadow": "0 4px 12px rgba(0,0,0,0.15)",
              "z-index": 1000,
              "white-space": "pre-wrap",
              "word-break": "break-all",
              "font-family": "monospace",
              "font-size": "0.875rem",
            }}
          >
            <button
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
                "font-size": "0.75rem",
                color: "var(--text-secondary)",
              }}
              onClick={closeTooltip}
            >
              ✕
            </button>
            <div style={{ "margin-top": "0.5rem" }}>{t().content}</div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default ResultsTable;
