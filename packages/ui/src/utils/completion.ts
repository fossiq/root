import {
  CompletionContext,
  CompletionResult,
  snippet,
} from "@codemirror/autocomplete";
import { Table } from "../contexts/SchemaContext";

const kqlKeywords = [
  { label: "where", type: "keyword", info: "Filter a table to the subset of rows that satisfy a predicate." },
  { label: "project", type: "keyword", info: "Select the columns to include, rename or drop, and insert new computed columns." },
  { label: "extend", type: "keyword", info: "Create calculated columns and append them to the result set." },
  { label: "summarize", type: "keyword", info: "Produce a table that aggregates the content of the input table." },
  { label: "sort by", type: "keyword", info: "Sort the rows of the input table into order by one or more columns." },
  { label: "order by", type: "keyword", info: "Sort the rows of the input table into order by one or more columns." },
  { label: "limit", type: "keyword", info: "Return up to the specified number of rows." },
  { label: "take", type: "keyword", info: "Return up to the specified number of rows." },
  { label: "top", type: "keyword", info: "Return the first N records sorted by the specified columns." },
  { label: "distinct", type: "keyword", info: "Produces a table with the distinct combination of the provided columns of the input table." },
  { label: "count", type: "keyword", info: "Returns the number of records in the input table." },
  { label: "join", type: "keyword", info: "Merge the rows of two tables to form a new table by matching values of the specified columns from each table." },
  { label: "union", type: "keyword", info: "Takes two or more tables and returns the rows of all of them." },
  { label: "mv-expand", type: "keyword", info: "Expands multi-value arrays or property bags into multiple records." },
  { label: "search", type: "keyword", info: "Search a text pattern in multiple tables and columns." },
  { label: "let", type: "keyword", info: "Binds a name to an expression." },
  { label: "print", type: "keyword", info: "Outputs a single row with one or more scalar expressions." },
  { label: "iff", type: "function", info: "Returns one of two values depending on the evaluation of the predicate." },
  { label: "now", type: "function", info: "Returns the current UTC clock time.", apply: "now()" },
  { label: "ago", type: "function", info: "Subtracts the given timespan from the current UTC clock time.", apply: snippet("ago(${1:1h})") },
  { label: "bin", type: "function", info: "Rounds values down to an integer multiple of a given bin size.", apply: snippet("bin(${1:value}, ${2:roundTo})") },
  { label: "strcat", type: "function", info: "Concatenates between 1 and 64 arguments.", apply: snippet("strcat(${1:val1}, ${2:val2})") },
  { label: "substring", type: "function", info: "Extracts a substring from a source string.", apply: snippet("substring(${1:source}, ${2:startingIndex}, ${3:length})") },
  { label: "tolower", type: "function", info: "Converts a string to lower case.", apply: snippet("tolower(${1:source})") },
  { label: "toupper", type: "function", info: "Converts a string to upper case.", apply: snippet("toupper(${1:source})") },
  { label: "contains", type: "keyword" },
  { label: "has", type: "keyword" },
  { label: "startswith", type: "keyword" },
  { label: "endswith", type: "keyword" },
  { label: "matches regex", type: "keyword" },
  { label: "in", type: "keyword" },
  { label: "between", type: "keyword" },
  { label: "and", type: "keyword" },
  { label: "or", type: "keyword" },
  { label: "not", type: "keyword" },
  { label: "asc", type: "keyword" },
  { label: "desc", type: "keyword" },
];

export function createKqlCompletion(tables: Table[]) {
  return (context: CompletionContext): CompletionResult | null => {
    let word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const tableOptions = tables.map((t) => ({
      label: t.name,
      type: "class",
      info: `Table with ${t.rowCount} rows`,
    }));

    // Flatten columns from all tables
    // In a real implementation, we would check the context to see which table is active
    // But for now, we'll just show all available columns
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
    // This is a simple heuristic regex scan
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

    return {
      from: word.from,
      options: [
        ...kqlKeywords,
        ...tableOptions,
        ...uniqueColumnOptions,
        ...uniqueAliases,
      ],
    };
  };
}
