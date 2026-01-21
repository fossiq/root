import { Component, For, Show } from "solid-js";
import { Icon } from "../icons";

interface PaginationProps {
  currentPage: number; // 0-based index
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

const Pagination: Component<PaginationProps> = (props) => {
  const siblingCount = props.siblingCount ?? 1;

  // Generate page numbers to display
  const paginationRange = () => {
    const totalPageCount = props.totalPages;
    const currentPage = props.currentPage + 1; // Convert to 1-based for display logic

    // Pages to always show: first, last, current, and siblings
    const totalNumbers = siblingCount * 2 + 5; // first + ellipsis + sibling + current + sibling + ellipsis + last
    const totalBlocks = totalNumbers + 2;

    if (totalPageCount <= totalBlocks) {
      return Array.from({ length: totalPageCount }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPageCount - rightItemCount + i + 1
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  };

  return (
    <div role="group" class="pagination-group" style={{ display: "flex", gap: "0.25rem" }}>
      {/* First Page */}
      <button
        class="outline"
        onClick={() => props.onPageChange(0)}
        disabled={props.currentPage === 0}
        title="First Page"
        style={{ padding: "0.25rem 0.5rem", "font-size": "0.8rem", width: "auto" }}
      >
        {"|<"}
      </button>

      {/* Previous Page */}
      <button
        class="outline"
        onClick={() => props.onPageChange(props.currentPage - 1)}
        disabled={props.currentPage === 0}
        title="Previous Page"
        style={{ padding: "0.25rem 0.5rem", "font-size": "0.8rem", width: "auto" }}
      >
        {"<"}
      </button>

      {/* Page Numbers */}
      <For each={paginationRange()}>
        {(pageNumber) => (
          <Show
            when={pageNumber !== "..."}
            fallback={
              <span style={{ padding: "0.25rem 0.5rem", "font-size": "0.8rem", "align-self": "center" }}>
                ...
              </span>
            }
          >
            <button
              class={props.currentPage + 1 === pageNumber ? "" : "outline"}
              onClick={() => props.onPageChange(Number(pageNumber) - 1)}
              style={{
                padding: "0.25rem 0.5rem",
                "font-size": "0.8rem",
                width: "auto",
                "min-width": "2rem"
              }}
            >
              {pageNumber}
            </button>
          </Show>
        )}
      </For>

      {/* Next Page */}
      <button
        class="outline"
        onClick={() => props.onPageChange(props.currentPage + 1)}
        disabled={props.currentPage >= props.totalPages - 1}
        title="Next Page"
        style={{ padding: "0.25rem 0.5rem", "font-size": "0.8rem", width: "auto" }}
      >
        {">"}
      </button>

      {/* Last Page */}
      <button
        class="outline"
        onClick={() => props.onPageChange(props.totalPages - 1)}
        disabled={props.currentPage >= props.totalPages - 1}
        title="Last Page"
        style={{ padding: "0.25rem 0.5rem", "font-size": "0.8rem", width: "auto" }}
      >
        {">|"}
      </button>
    </div>
  );
};

export default Pagination;
