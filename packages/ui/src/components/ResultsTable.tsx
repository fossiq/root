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
  data: any[];
}

const ResultsTable: Component<ResultsTableProps> = (props) => {
  const [sorting, setSorting] = createSignal<SortingState>([]);
  let parentRef: HTMLDivElement | undefined;

  // Dynamically generate columns based on the first item in data
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

  return (
    <div
      ref={parentRef}
      class="table-container"
      style={{
        height: "100%",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          "grid-template-columns": `repeat(${columnCount()}, minmax(max-content, 1fr))`,
          "min-width": "100%",
          width: "max-content",
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
                    background: "var(--bg-secondary)",
                    position: "sticky",
                    top: 0,
                    "z-index": 1,
                    cursor: header.column.getCanSort() ? "pointer" : "default",
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

        {/* Virtual rows container */}
        <div
          style={{
            "grid-column": "1 / -1",
            height: `${totalSize()}px`,
            position: "relative",
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
                    "grid-template-columns": `repeat(${columnCount()}, minmax(max-content, 1fr))`,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    "background-color": isEven
                      ? "var(--bg-primary)"
                      : "var(--bg-secondary)",
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
