import {
  createContext,
  useContext,
  createSignal,
  JSX,
  onMount,
} from "solid-js";
import * as duckdb from "@duckdb/duckdb-wasm";
import {
  storeFileHandle,
  getStoredFileHandles,
  removeFileHandle,
} from "../utils/fileHandleStore";

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
  addTable: (file: File, fileHandle?: FileSystemFileHandle) => Promise<void>;
  removeTable: (tableName: string) => Promise<void>;
  loading: () => boolean;
  db: () => duckdb.AsyncDuckDB | null;
  conn: () => duckdb.AsyncDuckDBConnection | null;
  pendingRestoreCount: () => number;
  restorePendingFiles: () => Promise<void>;
}

const SchemaContext = createContext<SchemaContextType>();

interface PendingFile {
  tableName: string;
  handle: FileSystemFileHandle;
}

export function SchemaProvider(props: { children: JSX.Element }) {
  const [tables, setTables] = createSignal<Table[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [db, setDb] = createSignal<duckdb.AsyncDuckDB | null>(null);
  const [conn, setConn] = createSignal<duckdb.AsyncDuckDBConnection | null>(
    null
  );
  const [pendingFiles, setPendingFiles] = createSignal<PendingFile[]>([]);

  const restoreStoredFiles = async (
    database: duckdb.AsyncDuckDB,
    connection: duckdb.AsyncDuckDBConnection
  ) => {
    try {
      const storedHandles = await getStoredFileHandles();
      const needsPermission: PendingFile[] = [];

      for (const { tableName, handle } of storedHandles) {
        try {
          // Check if we already have permission (without requesting)
          const permission = await handle.queryPermission({ mode: "read" });
          if (permission === "granted") {
            // Already have permission, restore immediately
            const file = await handle.getFile();
            await loadFileIntoDB(database, connection, file, tableName, handle);
          } else {
            // Need to request permission - queue for user interaction
            needsPermission.push({ tableName, handle });
          }
        } catch (err) {
          console.warn(`Failed to check permission for ${tableName}:`, err);
          await removeFileHandle(tableName);
        }
      }

      // Store files that need permission for later restore
      setPendingFiles(needsPermission);
    } catch (err) {
      console.error("Failed to restore stored files:", err);
    }
  };

  const restorePendingFiles = async () => {
    const database = db();
    const connection = conn();
    if (!database || !connection) return;

    const pending = pendingFiles();
    if (pending.length === 0) return;

    setLoading(true);
    const stillPending: PendingFile[] = [];

    for (const { tableName, handle } of pending) {
      try {
        const permission = await handle.requestPermission({ mode: "read" });
        if (permission === "granted") {
          const file = await handle.getFile();
          await loadFileIntoDB(database, connection, file, tableName, handle);
        } else {
          // User denied, remove from storage
          await removeFileHandle(tableName);
        }
      } catch (err) {
        console.warn(`Failed to restore file ${tableName}:`, err);
        // Keep in pending if it's a transient error, otherwise remove
        if ((err as Error).name === "NotAllowedError") {
          stillPending.push({ tableName, handle });
        } else {
          await removeFileHandle(tableName);
        }
      }
    }

    setPendingFiles(stillPending);
    setLoading(false);
  };

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

      // Restore previously loaded files
      await restoreStoredFiles(newDb, newConn);

      setLoading(false);
      console.log("DuckDB initialized");
    } catch (e) {
      console.error("Failed to initialize DuckDB", e);
      setLoading(false);
    }
  });

  const loadFileIntoDB = async (
    database: duckdb.AsyncDuckDB,
    connection: duckdb.AsyncDuckDBConnection,
    file: File,
    tableName: string,
    fileHandle?: FileSystemFileHandle
  ) => {
    // Register the file
    await database.registerFileHandle(
      file.name,
      file,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      true
    );

    // Create table from CSV
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
    const countResult = await connection.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const countValue = countResult.toArray()[0].count;
    const rowCount =
      typeof countValue === "bigint" ? Number(countValue) : countValue;

    const newTable: Table = {
      name: tableName,
      columns,
      rowCount,
    };

    setTables((prev) => [...prev, newTable]);

    // Store file handle for persistence across page reloads
    if (fileHandle) {
      await storeFileHandle(tableName, fileHandle);
    }
  };

  const removeTable = async (tableName: string) => {
    const connection = conn();
    if (!connection) return;

    setLoading(true);
    try {
      await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
      await removeFileHandle(tableName);
      setTables((prev) => prev.filter((t) => t.name !== tableName));
    } catch (error) {
      console.error("Error removing table:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTable = async (file: File, fileHandle?: FileSystemFileHandle) => {
    const database = db();
    const connection = conn();
    if (!database || !connection) return;

    setLoading(true);
    try {
      const tableName = file.name.replace(/\.[^/.]+$/, "").replace(/\W/g, "_"); // Sanitize table name
      await loadFileIntoDB(database, connection, file, tableName, fileHandle);
    } catch (error) {
      console.error("Error adding table:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingRestoreCount = () => pendingFiles().length;

  return (
    <SchemaContext.Provider
      value={{
        tables,
        addTable,
        removeTable,
        loading,
        db,
        conn,
        pendingRestoreCount,
        restorePendingFiles,
      }}
    >
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
