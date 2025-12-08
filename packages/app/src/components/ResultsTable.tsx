import { For, createMemo } from "solid-js";
import {
  createSolidTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/solid-table";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { appState } from "../store";
import type { DataRow } from "../store";

export const ResultsTable = () => {
  let parentRef!: HTMLDivElement;

  const displayData = createMemo(() => {
    return appState.queryResults ?? [];
  });

  const columns = createMemo<ColumnDef<DataRow>[]>(() => {
    const data = displayData();
    if (data.length === 0) return [];

    const firstRow = data[0];
    const cols = Object.keys(firstRow);

    return cols.map((col) => ({
      accessorKey: col,
      header: col,
      cell: (info) => {
        const value = info.getValue();
        if (value === null || value === undefined) return "-";
        return String(value);
      },
    }));
  });

  const table = createMemo(() =>
    createSolidTable({
      get data() {
        return displayData();
      },
      get columns() {
        return columns();
      },
      getCoreRowModel: getCoreRowModel(),
    })
  );

  const rowVirtualizer = createVirtualizer({
    get count() {
      return table().getRowModel().rows.length;
    },
    getScrollElement: () => parentRef,
    estimateSize: () => 35, // Approximate row height
    overscan: 20,
  });

  return (
    <div style={{ height: "100%", display: "flex", "flex-direction": "column" }}>
      <div
        ref={parentRef}
        style={{
          flex: "1 1 auto",
          overflow: "auto",
          position: "relative" // Needed for sticky header to work relative to this scrollview
        }}
      >
        <table role="grid" style={{ "border-collapse": "separate", "border-spacing": 0 }}>
          <thead style={{ position: "sticky", top: 0, "z-index": 1, background: "var(--sidebar-bg)" }}>
            <For each={table().getHeaderGroups()}>
              {(headerGroup) => (
                <tr>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <th scope="col" style={{ /* Ensure header background is opaque for sticky */ background: "var(--sidebar-bg)" }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </th>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </thead>
          <tbody>
            {/* Spacer Top */}
            {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
              <tr>
                <td colSpan={columns().length} style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px`, padding: 0, border: 0 }}></td>
              </tr>
            )}

            {/* Virtual Rows */}
            <For each={rowVirtualizer.getVirtualItems()}>
              {(virtualRow) => {
                const row = table().getRowModel().rows[virtualRow.index];
                return (
                  <tr data-index={virtualRow.index} ref={(el) => queueMicrotask(() => rowVirtualizer.measureElement(el))}>
                    <For each={row.getVisibleCells()}>
                      {(cell) => (
                        <td>
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

            {/* Spacer Bottom */}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end > 0
            ) && (
                <tr>
                  <td
                    colSpan={columns().length}
                    style={{
                      height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px`,
                      padding: 0,
                      border: 0
                    }}
                  ></td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "4px 16px", "border-top": "1px solid var(--ade-border)", "font-size": "11px", color: "var(--ade-text)" }}>
        {displayData().length} records
      </div>
    </div>
  );
};
