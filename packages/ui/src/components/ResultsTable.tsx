import { Component, For, createMemo } from "solid-js";
import {
  createSolidTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getSortedRowModel,
  SortingState,
} from "@tanstack/solid-table";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { createSignal } from "solid-js";

interface ResultsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Query results have dynamic schema based on user query
  data: any[];
}

const ResultsTable: Component<ResultsTableProps> = (props) => {
  const [sorting, setSorting] = createSignal<SortingState>([]);
  let parentRef: HTMLDivElement | undefined;

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
    estimateSize: () => 35, // Estimate row height
    overscan: 10,
  });

  // Create reactive accessors for virtualizer methods
  const virtualItems = () => rowVirtualizer.getVirtualItems();
  const totalSize = () => rowVirtualizer.getTotalSize();

  const columnCount = () => headerGroups()[0]?.headers.length || 1;

  // Use equal-width columns that distribute available space evenly
  const gridTemplateColumns = createMemo(() => {
    return `repeat(${columnCount()}, minmax(150px, 1fr))`;
  });

  return (
    <div
      ref={parentRef}
      class="table-container"
      style={{
        height: "100%",
        overflow: "auto",
        display: "flex",
        "flex-direction": "column",
      }}
    >
      <div
        style={{
          display: "grid",
          "grid-template-columns": gridTemplateColumns(),
          width: "100%",
          "flex-shrink": 0,
        }}
      >
        {/* Header */}
        <For each={headerGroups()}>
          {(headerGroup) => (
            <For each={headerGroup.headers}>
              {(header) => (
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    "font-weight": "bold",
                    "white-space": "nowrap",
                    overflow: "hidden",
                    "text-overflow": "ellipsis",
                    background: "var(--bg-secondary)",
                    position: "sticky",
                    top: 0,
                    "z-index": 1,
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    "border-bottom": "1px solid var(--border-color)",
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
                </div>
              )}
            </For>
          )}
        </For>
      </div>

      {/* Virtual rows container */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            height: `${totalSize()}px`,
          }}
        >
          <For each={virtualItems()}>
            {(virtualRow) => {
              const row = rows()[virtualRow.index];
              const isEven = virtualRow.index % 2 === 0;
              return (
                <div
                  style={{
                    display: "grid",
                    "grid-template-columns": gridTemplateColumns(),
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    "background-color": isEven
                      ? "var(--bg-primary)"
                      : "var(--bg-secondary)",
                    width: "100%",
                  }}
                >
                  <For each={row.getVisibleCells()}>
                    {(cell) => (
                      <div
                        style={{
                          padding: "0.5rem 1rem",
                          "white-space": "nowrap",
                          overflow: "hidden",
                          "text-overflow": "ellipsis",
                          "min-width": 0,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    )}
                  </For>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
