import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { Table } from "../contexts/SchemaContext";
import { kqlKeywords, aggregationFunctions } from "./completion-data";

export function createKqlCompletion(tables: Table[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    // Check if we are inside a summarize clause or after = or (
    const tree = syntaxTree(context.state);
    const node = tree.resolveInner(context.pos, -1);
    let isInsideSummarize = false;
    let isAfterOperator = false;

    // Check for summarize context
    let checkNode = node;
    while (checkNode) {
      if (
        checkNode.name === "SummarizeClause" ||
        checkNode.name === "summarizeClause"
      ) {
        isInsideSummarize = true;
        break;
      }
      checkNode = checkNode.parent!;
    }

    // Check if cursor is after = or ( which suggests function context
    const textBefore = context.state.doc.sliceString(
      Math.max(0, context.pos - 20),
      context.pos
    );
    if (/[=(]\s*\w*$/.test(textBefore)) {
      isAfterOperator = true;
    }

    const tableOptions = tables.map((t) => ({
      label: t.name,
      type: "class",
      info: `Table with ${t.rowCount} rows`,
    }));

    // Flatten columns from all tables
    const columnOptions = tables.flatMap((t) =>
      t.columns.map((c) => ({
        label: c.name,
        type: "variable",
        info: `Column (${c.type}) in ${t.name}`,
        boost: -1, // Lower priority than keywords and tables
      }))
    );

    // Deduplicate columns by name
    const uniqueColumnOptions = Array.from(
      new Map(columnOptions.map((c) => [c.label, c])).values()
    );

    // Scan current document for alias definitions (e.g. alias=expr)
    const docText = context.state.doc.toString();
    const aliasRegex = /\b([a-zA-Z0-9_]+)\s*=/g;
    const aliases = [];
    let match;
    while ((match = aliasRegex.exec(docText)) !== null) {
      if (match[1]) {
        aliases.push({
          label: match[1],
          type: "variable",
          info: "Calculated column (alias)",
          boost: 0,
        });
      }
    }

    // Deduplicate aliases
    const uniqueAliases = Array.from(
      new Map(aliases.map((a) => [a.label, a])).values()
    );

    const options = [
      ...kqlKeywords,
      ...tableOptions,
      ...uniqueColumnOptions,
      ...uniqueAliases,
    ];

    // Show aggregation functions in summarize context or after operators
    if (isInsideSummarize || isAfterOperator) {
      options.push(...aggregationFunctions);
    }

    return {
      from: word.from,
      options,
    };
  };
}
