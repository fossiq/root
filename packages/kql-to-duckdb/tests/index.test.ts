import { describe, test, expect, beforeAll } from "bun:test";
import { parseKql, initParser, kqlToDuckDB } from "../src/index";
import { resolve } from "path";

describe("KQL Parser Integration", () => {
  beforeAll(async () => {
    // Resolve path to the WASM file in the monorepo
    const wasmPath = resolve(
      import.meta.dir,
      "../../kql-parser/tree-sitter-kql.wasm"
    );
    await initParser(wasmPath);
  });

  test("should parse a simple query", () => {
    const kql = "Table | where Col > 10";
    const result = parseKql(kql);
    expect(result).toBeDefined();
    expect(result.type).toBe("source_file");
  });

  describe("Translation", () => {
    test("should translate simple table", () => {
      const kql = "Table";
      const sql = kqlToDuckDB(kql);
      expect(sql).toBe("SELECT * FROM Table");
    });

    test("should translate where clause", () => {
      const kql = "Table | where Col > 10";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain(
        "WITH cte_0 AS (SELECT * FROM Table WHERE Col > 10) SELECT * FROM cte_0"
      );
    });

    test("should translate project clause", () => {
      const kql = "Table | project Col1, Col2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain(
        "WITH cte_0 AS (SELECT Col1, Col2 FROM Table) SELECT * FROM cte_0"
      );
    });

    test("should translate take clause", () => {
      const kql = "Table | take 5";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain(
        "WITH cte_0 AS (SELECT * FROM Table LIMIT 5) SELECT * FROM cte_0"
      );
    });

    test("should translate pipeline", () => {
      const kql = "Table | where Col > 10 | project Col";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("cte_0 AS (SELECT * FROM Table WHERE Col > 10)");
      expect(sql).toContain("cte_1 AS (SELECT Col FROM cte_0)");
      expect(sql).toContain("SELECT * FROM cte_1");
    });

    test("should translate summarize", () => {
      const kql = "Table | summarize count() by Col";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("GROUP BY Col");
      expect(sql).toContain("COUNT(*)");
    });

    test("should translate summarize with sum", () => {
      const kql = "Table | summarize sum(Amount) by Category";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("GROUP BY Category");
      expect(sql).toContain("SUM(Amount)");
    });

    test("should translate summarize with avg", () => {
      const kql = "Table | summarize avg(Price) by Product";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("GROUP BY Product");
      expect(sql).toContain("AVG(Price)");
    });

    test("should translate summarize with min", () => {
      const kql = "Table | summarize min(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("MIN(Value)");
    });

    test("should translate summarize with max", () => {
      const kql = "Table | summarize max(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("MAX(Value)");
    });

    test("should translate summarize with multiple aggregations", () => {
      const kql =
        "Table | summarize count(), sum(Amount), avg(Price) by Category";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("GROUP BY Category");
      expect(sql).toContain("COUNT(*)");
      expect(sql).toContain("SUM(Amount)");
      expect(sql).toContain("AVG(Price)");
    });

    test("should translate summarize with named aggregations", () => {
      const kql =
        "Table | summarize Total=sum(Amount), Average=avg(Price) by Category";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SUM(Amount) AS Total");
      expect(sql).toContain("AVG(Price) AS Average");
      expect(sql).toContain("GROUP BY Category");
    });

    test("should translate summarize with min and max together", () => {
      const kql = "Table | summarize min(Value), max(Value) by Category";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("GROUP BY Category");
      expect(sql).toContain("MIN(Value)");
      expect(sql).toContain("MAX(Value)");
    });

    test("should translate extend clause", () => {
      const kql = "Table | extend NewCol = Col * 2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT *, (Col * 2) AS NewCol FROM Table");
    });

    test("should translate extend with multiple columns", () => {
      const kql = "Table | extend Col1 = A + B, Col2 = C * D";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT *,");
      expect(sql).toContain("(A + B) AS Col1");
      expect(sql).toContain("(C * D) AS Col2");
      expect(sql).toContain("FROM Table");
    });

    test("should translate extend with expression", () => {
      const kql = "Table | extend Double = Value * 2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("(Value * 2) AS Double");
    });

    test("should translate sort clause ascending", () => {
      const kql = "Table | sort by Col asc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ORDER BY Col ASC");
    });

    test("should translate sort clause descending", () => {
      const kql = "Table | sort by Col desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ORDER BY Col DESC");
    });

    test("should translate sort with multiple columns", () => {
      const kql = "Table | sort by Col1 asc, Col2 desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ORDER BY Col1 ASC, Col2 DESC");
    });

    test("should translate sort with default direction", () => {
      const kql = "Table | sort by Col";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ORDER BY Col ASC");
    });

    test("should translate pipeline with extend and sort", () => {
      const kql =
        "Table | where Value > 10 | extend Double = Value * 2 | sort by Double desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("cte_0 AS (SELECT * FROM Table WHERE Value > 10)");
      expect(sql).toContain(
        "cte_1 AS (SELECT *, (Value * 2) AS Double FROM cte_0)"
      );
      expect(sql).toContain(
        "cte_2 AS (SELECT * FROM cte_1 ORDER BY Double DESC)"
      );
    });

    test("should translate extend in pipeline", () => {
      const kql = "Table | project Col1, Col2 | extend Col3 = Col1 + Col2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("cte_0 AS (SELECT Col1, Col2 FROM Table)");
      expect(sql).toContain(
        "cte_1 AS (SELECT *, (Col1 + Col2) AS Col3 FROM cte_0)"
      );
    });

    test("should translate complex pipeline with all operators", () => {
      const kql =
        "Table | where Status > 0 | project Name, Value | extend Double = Value * 2 | summarize sum(Double) by Name | sort by Double desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Status > 0");
      expect(sql).toContain("SELECT Name, Value FROM");
      expect(sql).toContain("(Value * 2) AS Double");
      expect(sql).toContain("GROUP BY Name");
      expect(sql).toContain("ORDER BY Double DESC");
    });

    test("should translate distinct all columns", () => {
      const kql = "Table | distinct";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT DISTINCT * FROM Table");
    });

    test("should translate distinct specific columns", () => {
      const kql = "Table | distinct Col1, Col2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT DISTINCT Col1, Col2 FROM Table");
    });

    test("should translate distinct in pipeline", () => {
      const kql = "Table | project Col1, Col2, Col3 | distinct Col1, Col2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("cte_0 AS (SELECT Col1, Col2, Col3 FROM Table)");
      expect(sql).toContain("cte_1 AS (SELECT DISTINCT Col1, Col2 FROM cte_0)");
    });

    test("should translate contains string expression", () => {
      const kql = "Table | where Name contains 'John'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LIKE");
    });

    test("should translate startswith string expression", () => {
      const kql = "Table | where Email startswith 'admin'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LIKE");
    });

    test("should translate endswith string expression", () => {
      const kql = "Table | where Url endswith '.com'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LIKE");
    });

    test("should translate matches string expression", () => {
      const kql = "Table | where Phone matches '\\d{3}-\\d{3}-\\d{4}'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("REGEXP");
    });

    test("should translate has string expression", () => {
      const kql = "Table | where Tags has 'important'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LIKE");
    });
  });
});
