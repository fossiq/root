import { createStore } from 'solid-js/store';
import type { DataRow } from '@fossiq/kql-executor';

export type { DataRow }; // Re-export for components

export interface AppState {
  csvData: DataRow[]; // Keeping this for preview/UI logic consistency for now
  columns: string[];
  fileName: string | null;
  query: string;
  queryResults: DataRow[] | null;
  error: string | null;
  isLoading: boolean;
}

const initialState: AppState = {
  csvData: [],
  columns: [],
  fileName: null,
  query: '',
  queryResults: null,
  error: null,
  isLoading: false,
};

// Load state from session storage if available
const loadStateFromSession = (): Partial<AppState> => {
  try {
    const stored = sessionStorage.getItem('expeditionState');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Note: In real IDB world, we should probably not store massive csvData in session storage.
      // But for this refactor I'll adhere to keeping it functional.
      return {
        csvData: parsed.csvData || [],
        columns: parsed.columns || [],
        fileName: parsed.fileName || null,
      };
    }
  } catch (e) {
    console.error('Failed to load state from session storage:', e);
  }
  return {};
};

const savedState = loadStateFromSession();

export const [appState, setAppState] = createStore<AppState>({
  ...initialState,
  ...savedState,
});

// Save relevant state to session storage
export const saveStateToSession = () => {
  try {
    const stateToSave = {
      // Limiting saved data to save session storage space?
      // For now, save what we have.
      csvData: appState.csvData,
      columns: appState.columns,
      fileName: appState.fileName,
    };
    sessionStorage.setItem('expeditionState', JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Failed to save state to session storage:', e);
  }
};

export const setCSVData = (data: DataRow[], columns: string[], fileName: string) => {
  setAppState({
    csvData: data,
    columns,
    fileName,
    error: null,
  });
  saveStateToSession();
};

export const setQuery = (query: string) => {
  setAppState('query', query);
};

export const setQueryResults = (results: DataRow[] | null) => {
  setAppState('queryResults', results);
};

export const setError = (error: string | null) => {
  setAppState('error', error);
};

export const setLoading = (isLoading: boolean) => {
  setAppState('isLoading', isLoading);
};

export const clearData = () => {
  setAppState({
    csvData: [],
    columns: [],
    fileName: null,
    queryResults: null,
    error: null,
  });
  try {
    sessionStorage.removeItem('expeditionState');
  } catch (e) {
    console.error('Failed to clear session storage:', e);
  }
};
