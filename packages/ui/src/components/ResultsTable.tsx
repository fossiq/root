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
import styles from "./ResultsTable.module.css";

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

  const columns = createMemo<ColumnDef<unknown>[]>(() => {
    if (!props.data || props.data.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowNumberColumn: ColumnDef<unknown> = {
      id: "rowNumber",
      header: "#",
      cell: (info) => info.row.index + 1,
      enableSorting: false,
      size: 50,
    };

    const firstItem = props.data[0];
    const dataColumns = Object.keys(firstItem).map((key) => {
      const headerWidth = key.length * 10 + 20;
      const value = firstItem[key];
      const valueString =
        value === null || value === undefined ? "" : String(value);
      const valueWidth = valueString.length * 8 + 20;

      const estimatedWidth = Math.min(
        Math.max(headerWidth, valueWidth, 100),
        300
      );

      return {
        accessorKey: key,
        header: key,
        cell: (info) => {
          const val = info.getValue();
          return typeof val === "bigint" ? String(val) : val;
        },
        size: estimatedWidth,
      } as ColumnDef<unknown>;
    });

    return [rowNumberColumn, ...dataColumns];
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

  const rows = createMemo(() => table.getRowModel().rows);
  const headerGroups = createMemo(() => table.getHeaderGroups());

  const rowVirtualizer = createVirtualizer({
    get count() {
      return rows().length;
    },
    getScrollElement: () => parentRef ?? null,
    estimateSize: () => 35,
    overscan: 20,
  });

  const virtualItems = () => rowVirtualizer.getVirtualItems();
  const totalSize = () => rowVirtualizer.getTotalSize();

  const handleCellClick = (e: MouseEvent, value: unknown) => {
    const target = e.currentTarget as HTMLElement;
    const stringValue = String(value ?? "");

    if (target.scrollWidth <= target.clientWidth) {
      return;
    }

    const currentTooltip = tooltip();
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
      class={styles.container}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("td")) {
          closeTooltip();
        }
      }}
    >
      <table class={styles.table}>
        <thead class={styles.thead}>
          <For each={headerGroups()}>
            {(headerGroup) => (
              <tr>
                <For each={headerGroup.headers}>
                  {(header) => {
                    const isRowNumber = header.id === "rowNumber";
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        class={`${styles.th} ${
                          isRowNumber ? styles.thRowNumber : ""
                        } ${canSort ? styles.thSortable : ""}`}
                        style={{
                          width: `${header.column.getSize()}px`,
                          "min-width": `${header.column.getSize()}px`,
                          "text-align": isRowNumber ? "right" : "left",
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
                    );
                  }}
                </For>
              </tr>
            )}
          </For>
        </thead>
        <tbody>
          {virtualItems().length > 0 && (virtualItems()[0]?.start ?? 0) > 0 && (
            <tr>
              <td
                class={styles.spacerCell}
                style={{
                  height: `${virtualItems()[0]?.start ?? 0}px`,
                }}
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
                  class={isEven ? styles.rowEven : styles.rowOdd}
                  style={{ height: `${virtualRow.size}px` }}
                >
                  <For each={row.getVisibleCells()}>
                    {(cell) => {
                      const value = cell.getValue();
                      const isRowNumber = cell.column.id === "rowNumber";
                      return (
                        <td
                          class={
                            isRowNumber ? styles.cellRowNumber : styles.cell
                          }
                          style={{
                            width: `${cell.column.getSize()}px`,
                            "min-width": `${cell.column.getSize()}px`,
                          }}
                          onClick={(e) =>
                            !isRowNumber && handleCellClick(e, value)
                          }
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
          {virtualItems().length > 0 && (
            <tr>
              <td
                class={styles.spacerCell}
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

      <Show when={tooltip()}>
        {(t) => (
          <div
            class={styles.tooltip}
            style={{
              left: `${t().x}px`,
              top: `${t().y}px`,
            }}
          >
            <button class={styles.tooltipClose} onClick={closeTooltip}>
              ✕
            </button>
            <div class={styles.tooltipContent}>{t().content}</div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default ResultsTable;
