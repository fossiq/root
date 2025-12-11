import { Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { toParsedAST } from "@fossiq/kql-lezer";
import { Table } from "../contexts/SchemaContext";

/**
 * Creates a KQL linter with access to the schema.
 *
 * @param tables - The list of available tables in the schema
 * @returns A CodeMirror linter source function
 */
export const createKqlLinter =
  (tables: Table[]) =>
  (view: EditorView): Diagnostic[] => {
    const doc = view.state.doc.toString();
    const diagnostics: Diagnostic[] = [];

    // 1. Syntax Errors (from Lezer parser)
    const { errors } = toParsedAST(doc);
    errors.forEach((error) => {
      diagnostics.push({
        from: error.start,
        to: error.end,
        severity: "error",
        message: error.message,
        source: "KQL Syntax",
      });
    });

    // 2. Semantic Checks (Schema Validation)
    const tree = syntaxTree(view.state);

    tree.cursor().iterate((node) => {
      // Check for Table Existence
      if (node.name === "Identifier") {
        // We need to check the parent to know if it's a table usage
        // node.node gives the SyntaxNode wrapper which has parent access
        const parent = node.node.parent;

        if (parent?.name === "tableExpression") {
          const tableName = doc.slice(node.from, node.to);
          const tableExists = tables.some((t) => t.name === tableName);

          if (!tableExists) {
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: "error",
              message: `Table '${tableName}' not found in schema`,
              source: "Semantic Check",
            });
          }
        }
      }
    });

    return diagnostics;
  };
