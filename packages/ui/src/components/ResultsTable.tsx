import { Component, For, createMemo, createEffect } from "solid-js";
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

  const { rows } = table.getRowModel();

  const rowVirtualizer = createVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef ?? null,
    estimateSize: () => 35, // Estimate row height
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      class="table-container"
      style={{
        height: "100%",
        overflow: "auto",
        position: "relative", // Needed for sticky header context
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <table style={{ width: "100%", "table-layout": "fixed" }}>
          <thead
            style={{
              position: "sticky",
              top: 0,
              "z-index": 1,
              background: "var(--bg-secondary)",
              display: "grid", // Use grid for alignment with virtual rows if needed, or keeping it simple
            }}
          >
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <tr style={{ display: "flex", width: "100%" }}>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <th
                        style={{
                          width: `${100 / headerGroup.headers.length}%`, // Simple equal width for now
                          display: "flex",
                          cursor: header.column.getCanSort()
                            ? "pointer"
                            : "default",
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
          <tbody
            style={{
              display: "grid",
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            <For each={rowVirtualizer.getVirtualItems()}>
              {(virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: "flex",
                    }}
                  >
                    <For each={row.getVisibleCells()}>
                      {(cell) => (
                        <td
                          style={{
                            width: `${100 / row.getVisibleCells().length}%`,
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "white-space": "nowrap",
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      )}
                    </For>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
