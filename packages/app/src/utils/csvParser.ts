import Papa from "papaparse";
import type { DataRow } from "../store";

export interface ParsedCSV {
  data: DataRow[];
  columns: string[];
}

export const parseCSVFile = (file: File): Promise<ParsedCSV> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessages = results.errors
            .map((err) => `Row ${err.row}: ${err.message}`)
            .join("\n");
          reject(new Error(`CSV parsing errors:\n${errorMessages}`));
          return;
        }

        const data = results.data as DataRow[];
        const columns = results.meta.fields || [];

        if (columns.length === 0 || data.length === 0) {
          reject(new Error("CSV file is empty or has no valid columns"));
          return;
        }

        resolve({ data, columns });
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
};

export const parseCSVFromText = (text: string): Promise<ParsedCSV> => {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessages = results.errors
            .map((err) => `Row ${err.row}: ${err.message}`)
            .join("\n");
          reject(new Error(`CSV parsing errors:\n${errorMessages}`));
          return;
        }

        const data = results.data as DataRow[];
        const columns = results.meta.fields || [];

        if (columns.length === 0 || data.length === 0) {
          reject(new Error("CSV file is empty or has no valid columns"));
          return;
        }

        resolve({ data, columns });
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
};
