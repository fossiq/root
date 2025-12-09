import {
  createContext,
  useContext,
  createSignal,
  JSX,
  onMount,
} from "solid-js";
import * as duckdb from "@duckdb/duckdb-wasm";

export interface Column {
  name: string;
  type: string;
}

export interface Table {
  name: string;
  columns: Column[];
  rowCount: number;
}

interface SchemaContextType {
  tables: () => Table[];
  addTable: (file: File) => Promise<void>;
  loading: () => boolean;
  db: () => duckdb.AsyncDuckDB | null;
  conn: () => duckdb.AsyncDuckDBConnection | null;
}

const SchemaContext = createContext<SchemaContextType>();

export function SchemaProvider(props: { children: JSX.Element }) {
  const [tables, setTables] = createSignal<Table[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [db, setDb] = createSignal<duckdb.AsyncDuckDB | null>(null);
  const [conn, setConn] = createSignal<duckdb.AsyncDuckDBConnection | null>(
    null
  );

  onMount(async () => {
    try {
      const logger = new duckdb.ConsoleLogger();
      // Use static path for worker, assumes it's served from public root
      const worker = new Worker("/duckdb-browser-eh.worker.js");

      const newDb = new duckdb.AsyncDuckDB(logger, worker);
      // Use static path for WASM
      await newDb.instantiate("/duckdb-eh.wasm");
      const newConn = await newDb.connect();

      setDb(newDb);
      setConn(newConn);
      setLoading(false);
      console.log("DuckDB initialized");
    } catch (e) {
      console.error("Failed to initialize DuckDB", e);
      setLoading(false);
    }
  });

  const addTable = async (file: File) => {
    const database = db();
    const connection = conn();
    if (!database || !connection) return;

    setLoading(true);
    try {
      const tableName = file.name.replace(/\.[^/.]+$/, "").replace(/\W/g, "_"); // Sanitize table name

      // Register the file
      await database.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

      // Create table from CSV
      // duckdb-wasm automatically detects CSV if we use insertCSVFromPath or creating a table from it
      await connection.insertCSVFromPath(file.name, {
        name: tableName,
        schema: "main",
        header: true,
        detect: true,
      });

      // Get schema
      const schemaResult = await connection.query(`DESCRIBE ${tableName}`);
      const columns: Column[] = schemaResult.toArray().map((row: any) => ({
        name: row.column_name,
        type: row.column_type,
      }));

      // Get row count
      const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      // Handle BigInt result safely
      const countValue = countResult.toArray()[0].count;
      const rowCount = typeof countValue === 'bigint' ? Number(countValue) : countValue;

      const newTable: Table = {
        name: tableName,
        columns,
        rowCount,
      };

      setTables((prev) => [...prev, newTable]);
    } catch (error) {
      console.error("Error adding table:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SchemaContext.Provider value={{ tables, addTable, loading, db, conn }}>
      {props.children}
    </SchemaContext.Provider>
  );
}

export function useSchema() {
  const context = useContext(SchemaContext);
  if (!context) {
    throw new Error("useSchema must be used within a SchemaProvider");
  }
  return context;
}