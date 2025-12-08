
import Dexie, { Table } from 'dexie';

// --- Data Models ---

export interface DataRow {
  [key: string]: string | number | null | boolean;
}

// Internal storage row (includes tableName for indexing)
type DBRow = DataRow & {
  tableName: string;
  id?: number; // Auto-incremented ID
};

// --- Dexie Database Class ---

class KQLDatabase extends Dexie {
  rows!: Table<DBRow, number>;

  constructor() {
    super('KQLDB');
    this.version(3).stores({
      rows: '++id, tableName' // Index by tableName for fast lookup
    });
  }
}

const db = new KQLDatabase();

export const saveTable = async (tableName: string, rows: DataRow[]): Promise<void> => {
  // Transaction: Delete old rows for this table, then Insert new
  await db.transaction('rw', db.rows, async () => {
    // 1. Delete existing
    await db.rows.where('tableName').equals(tableName).delete();

    // 2. Prepare new rows
    const dbRows = rows.map(r => ({ ...r, tableName }));

    // 3. Bulk Add
    await db.rows.bulkAdd(dbRows);
  });
};

export const getTable = async (tableName: string): Promise<DataRow[]> => {
  // Basic fetch for compatibility
  return await db.rows.where('tableName').equals(tableName).toArray();
};

// --- Execution Engine ---

export const executeKQLQuery = async (
  query: string,
  currentFileName?: string,
): Promise<DataRow[]> => {
  if (!query.trim()) return [];

  const lines = query
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // 1. Determine Source Table & Build Initial Collection
  let tableName = currentFileName;

  const potentialTableName = parseTableName(lines[0]);
  if (potentialTableName) {
    tableName = potentialTableName;
  }

  if (!tableName) return [];

  // Start Dexie Collection
  let collection = db.rows.where('tableName').equals(tableName);

  // --- Normalized Execution Strategy ---
  // 1. Parse simple operators list
  const operators = parseQueryToOperators(lines);

  // 2. Apply pushdown to Collection
  let opIdx = 0;
  for (; opIdx < operators.length; opIdx++) {
    const op = operators[opIdx];

    if (op.type === 'where') {
      // Dexie filter: check logic
      collection = collection.filter(row => evaluateCondition(row, op.arg));
    } else if (op.type === 'take') {
      collection = collection.limit(parseInt(op.arg, 10));
      // `take` is usually the end of a fetch for UI, but in KQL it can be anywhere.
      // Dexie limit reduces the result set. 
    } else {
      // Cannot push down (Project, Summarize, Sort, etc.)
      break;
    }
  }

  // 3. Materialize
  const materializedResults = await collection.toArray();

  // Cleanup internal DB fields
  const cleanResults = materializedResults.map(({ tableName, id, ...rest }) => rest);

  // 4. Process remaining operators in-memory
  let result = cleanResults;
  for (; opIdx < operators.length; opIdx++) {
    result = executeMemoryOperator(result, operators[opIdx]);
  }

  return result;
};

// --- Parser ---

type Operator =
  | { type: 'table', arg: string }
  | { type: 'where', arg: string }
  | { type: 'take', arg: string }
  | { type: 'project', arg: string }
  | { type: 'sort', arg: string }
  | { type: 'summarize', arg: string }
  | { type: 'distinct', arg: string }
  | { type: 'count', arg: string };

const parseQueryToOperators = (lines: string[]): Operator[] => {
  const ops: Operator[] = [];

  for (const line of lines) {
    const clean = line.split("//")[0].trim();
    if (!clean) continue;

    const parts = clean.split("|").map(s => s.trim()).filter(s => s);

    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];

      // Actually, we rely on the parser:
      // If it starts with known keyword -> Operator.
      // If not -> Table? 

      const lower = part.toLowerCase();
      let type: Operator['type'] | null = null;
      let arg = "";

      if (lower.startsWith("where ")) { type = 'where'; arg = part.substring(6).trim(); }
      else if (lower.startsWith("take ") || lower.startsWith("limit ")) { type = 'take'; arg = part.split(" ")[1]; }
      else if (lower.startsWith("project ")) { type = 'project'; arg = part.substring(8).trim(); }
      else if (lower.startsWith("sort by ") || lower.startsWith("order by ")) { type = 'sort'; arg = lower.includes("sort by ") ? part.substring(8).trim() : part.substring(9).trim(); }
      else if (lower.startsWith("summarize ")) { type = 'summarize'; arg = part.substring(10).trim(); }
      else if (lower.startsWith("distinct ")) { type = 'distinct'; arg = part.substring(9).trim(); }
      else if (lower === "count") { type = 'count'; arg = ""; }
      else {
        // Assume table reference?
        // Only valid if it matches defaultTable logic or explicit
        // We'll ignore it if it matches the 'tableName' context we already established
        // If it's something else, KQL implies joining or just error?
        // We'll treat it as 'table' op for now.
        type = 'table';
        arg = part.replace(/^\[['"]|['"]\]$|^['"]|['"]$/g, "");
      }

      if (type) ops.push({ type, arg });
    }
  }

  // Remove initial table op if it matches our context, or validate
  if (ops.length > 0 && ops[0].type === 'table') {
    ops.shift();
  }

  return ops;
}

const parseTableName = (line: string): string | null => {
  const clean = line.split("//")[0].trim();
  if (clean.startsWith("|")) return null;
  const firstPart = clean.split("|")[0].trim();
  if (isKeyword(firstPart)) return null; // Safety: don't confuse "print" with table
  return firstPart.replace(/^\[['"]|['"]\]$|^['"]|['"]$/g, "");
}

const isKeyword = (str: string) => {
  const s = str.toLowerCase();
  return s.startsWith("print") || s.startsWith("datatable");
}


// --- In-Memory Executor (Pipeline) ---

const executeMemoryOperator = (data: DataRow[], op: Operator): DataRow[] => {
  switch (op.type) {
    case 'where': return executeWhere(data, op.arg);
    case 'take': return data.slice(0, parseInt(op.arg, 10)); // Memory fallback if needed
    case 'project': return executeProject(data, op.arg);
    case 'sort': return executeSort(data, op.arg);
    case 'summarize': return executeSummarize(data, op.arg);
    case 'distinct': return executeDistinct(data, op.arg);
    case 'count': return [{ Count: data.length }];
    default: return data;
  }
}

// --- Logic Helpers (Reused) ---

const executeWhere = (data: DataRow[], condition: string): DataRow[] => {
  return data.filter((row) => evaluateCondition(row, condition));
};

const evaluateCondition = (row: DataRow, condition: string): boolean => {
  try {
    if (condition.includes(" contains ")) {
      const [left, right] = condition.split(" contains ").map((s) => s.trim());
      return String(getFieldValue(row, left)).toLowerCase().includes(String(cleanValue(right)).toLowerCase());
    }
    if (condition.includes(" has ")) {
      const [left, right] = condition.split(" has ").map((s) => s.trim());
      return new RegExp(`\\b${cleanValue(right)}\\b`, "i").test(String(getFieldValue(row, left)));
    }
    if (condition.includes(" startswith ")) {
      const [left, right] = condition.split(" startswith ").map((s) => s.trim());
      return String(getFieldValue(row, left)).toLowerCase().startsWith(String(cleanValue(right)).toLowerCase());
    }
    if (condition.includes(" endswith ")) {
      const [left, right] = condition.split(" endswith ").map((s) => s.trim());
      return String(getFieldValue(row, left)).toLowerCase().endsWith(String(cleanValue(right)).toLowerCase());
    }
    if (condition.includes("==")) {
      const [left, right] = condition.split("==").map((s) => s.trim());
      return getFieldValue(row, left) == cleanValue(right);
    }
    if (condition.includes("!=")) {
      const [left, right] = condition.split("!=").map((s) => s.trim());
      return getFieldValue(row, left) != cleanValue(right);
    }
    if (condition.includes(">=")) {
      const [left, right] = condition.split(">=").map((s) => s.trim());
      return Number(getFieldValue(row, left)) >= Number(cleanValue(right));
    }
    if (condition.includes("<=")) {
      const [left, right] = condition.split("<=").map((s) => s.trim());
      return Number(getFieldValue(row, left)) <= Number(cleanValue(right));
    }
    if (condition.includes(">")) {
      const [left, right] = condition.split(">").map((s) => s.trim());
      return Number(getFieldValue(row, left)) > Number(cleanValue(right));
    }
    if (condition.includes("<")) {
      const [left, right] = condition.split("<").map((s) => s.trim());
      return Number(getFieldValue(row, left)) < Number(cleanValue(right));
    }
    if (condition.includes(" and ")) {
      return condition.split(" and ").every((part) => evaluateCondition(row, part.trim()));
    }
    if (condition.includes(" or ")) {
      return condition.split(" or ").some((part) => evaluateCondition(row, part.trim()));
    }
    return false;
  } catch (e) {
    return false;
  }
};

const getFieldValue = (row: DataRow, field: string): string | number | null | boolean => {
  return row[field.trim()] ?? null;
};

const cleanValue = (value: string): string | number => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  const num = Number(trimmed);
  return isNaN(num) ? trimmed : num;
};

const executeProject = (data: DataRow[], fields: string): DataRow[] => {
  const fieldList = fields.split(",").map((f) => f.trim());
  return data.map((row) => {
    const newRow: DataRow = {};
    for (const field of fieldList) {
      if (field.includes(" as ")) {
        const [original, newName] = field.split(" as ").map((s) => s.trim());
        newRow[newName] = row[original] ?? null;
      } else {
        newRow[field] = row[field] ?? null;
      }
    }
    return newRow;
  });
};

const executeSort = (data: DataRow[], sortExpr: string): DataRow[] => {
  const parts = sortExpr.split(",").map((s) => s.trim());
  const sortFields = parts.map((part) => {
    const tokens = part.split(" ");
    return { field: tokens[0], direction: tokens[1]?.toLowerCase() === "desc" ? "desc" : "asc" };
  });

  return [...data].sort((a, b) => {
    for (const { field, direction } of sortFields) {
      const aVal = a[field];
      const bVal = b[field];
      let comparison = 0;
      if (aVal == null) comparison = 1;
      else if (bVal == null) comparison = -1;
      else if (typeof aVal === "number" && typeof bVal === "number") comparison = aVal - bVal;
      else comparison = String(aVal).localeCompare(String(bVal));
      if (comparison !== 0) return direction === "desc" ? -comparison : comparison;
    }
    return 0;
  });
};

const executeSummarize = (data: DataRow[], expr: string): DataRow[] => {
  if (/ by /i.test(expr)) {
    const [aggExpr, byExpr] = expr.split(/ by /i).map((s) => s.trim());
    const groupFields = byExpr.split(",").map((s) => s.trim());
    const groups = new Map<string, DataRow[]>();
    for (const row of data) {
      const key = groupFields.map((f) => String(row[f] ?? "")).join("|");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    const results: DataRow[] = [];
    for (const [, rows] of groups) {
      const result: DataRow = {};
      groupFields.forEach((field) => result[field] = rows[0][field]);

      // Parse aggregation with optional alias: "alias=count(...)" or just "count(...)"
      let columnName = "count_";
      let aggregationExpr = aggExpr;

      // Check for alias syntax: alias=aggregation
      if (aggExpr.includes("=")) {
        const [alias, agg] = aggExpr.split("=").map((s) => s.trim());
        columnName = alias;
        aggregationExpr = agg;
      }

      // Basic support for count() and count(field) with regex
      if (/count\(.*?\)/i.test(aggregationExpr)) {
        const countMatch = aggregationExpr.match(/count\((.*?)\)/i);
        const fieldToCheck = countMatch ? countMatch[1].trim() : "";

        let countVal = rows.length;
        if (fieldToCheck && fieldToCheck !== "") {
          countVal = rows.filter(r => r[fieldToCheck] !== null && r[fieldToCheck] !== undefined && r[fieldToCheck] !== "").length;
        }
        result[columnName] = countVal;
      }
      results.push(result);
    }
    return results;
  } else if (/count\(.*?\)/i.test(expr)) {
    // Handle non-grouped aggregation with optional alias
    let columnName = "Count";
    let aggregationExpr = expr;

    if (expr.includes("=")) {
      const [alias, agg] = expr.split("=").map((s) => s.trim());
      columnName = alias;
      aggregationExpr = agg;
    }

    const countMatch = aggregationExpr.match(/count\((.*?)\)/i);
    const fieldToCheck = countMatch ? countMatch[1].trim() : "";
    let countVal = data.length;
    if (fieldToCheck && fieldToCheck !== "") {
      countVal = data.filter(r => r[fieldToCheck] !== null && r[fieldToCheck] !== undefined && r[fieldToCheck] !== "").length;
    }
    return [{ [columnName]: countVal }];
  }
  return data;
};

const executeDistinct = (data: DataRow[], fields: string): DataRow[] => {
  const fieldList = fields.split(",").map((f) => f.trim());
  const seen = new Set<string>();
  const results: DataRow[] = [];
  for (const row of data) {
    const key = fieldList.map((f) => String(row[f] ?? "")).join("|");
    if (!seen.has(key)) {
      seen.add(key);
      const newRow: DataRow = {};
      fieldList.forEach((field) => newRow[field] = row[field]);
      results.push(newRow);
    }
  }
  return results;
};
