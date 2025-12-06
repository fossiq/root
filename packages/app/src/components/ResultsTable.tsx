import { For, createMemo } from "solid-js";
import {
  createSolidTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/solid-table";
import { appState } from "../store";
import type { DataRow } from "../store";

export const ResultsTable = () => {
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

  return (
    <div style={{ height: "100%", display: "flex", "flex-direction": "column" }}>
      <div style={{ flex: "1 1 auto", overflow: "auto" }}>
        <table role="grid">
          <thead>
            <For each={table().getHeaderGroups()}>
              {(headerGroup) => (
                <tr>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <th scope="col">
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
            <For each={table().getRowModel().rows}>
              {(row) => (
                <tr>
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
              )}
            </For>
          </tbody>
        </table>
      </div>
      <div style={{ padding: "4px 16px", "border-top": "1px solid var(--ade-border)", "font-size": "11px", color: "var(--ade-text)" }}>
        {displayData().length} records
      </div>
    </div>
  );
};
