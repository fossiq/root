import { translate } from "./translator";

export { translate };

export type SourceFile = unknown;

export async function initParser(
    _wasmPath: string,
    _treeSitterWasmPath?: string,
): Promise<void> {
    // Stub: kql-parser removed
}

export function parseKql(_query: string): unknown {
    throw new Error(
        "parseKql is not implemented: kql-parser has been removed.",
    );
}

export function kqlToDuckDB(_query: string): string {
    throw new Error(
        "kqlToDuckDB is not implemented: kql-parser has been removed.",
    );
}
