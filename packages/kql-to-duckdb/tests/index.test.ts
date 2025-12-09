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

    test("should translate inner join", () => {
      const kql = "Table1 | join kind=inner Table2 on Col1 == Col2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("INNER JOIN");
      expect(sql).toContain("Table2");
      expect(sql).toContain("ON");
    });

    test("should translate left outer join", () => {
      const kql = "Table1 | join kind=leftouter Table2 on Id == UserId";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LEFT OUTER JOIN");
      expect(sql).toContain("Table2");
      expect(sql).toContain("Table1.Id = Table2.UserId");
    });

    test("should translate right outer join", () => {
      const kql = "Table1 | join kind=rightouter Table2 on Key == Key";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("RIGHT OUTER JOIN");
      expect(sql).toContain("Table2");
    });

    test("should translate full outer join", () => {
      const kql = "Table1 | join kind=fullouter Table2 on X == Y";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("FULL OUTER JOIN");
      expect(sql).toContain("Table2");
    });

    test("should translate left anti join", () => {
      const kql = "Table1 | join kind=leftanti Table2 on Id == Id";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LEFT ANTI JOIN");
    });

    test("should translate right anti join", () => {
      const kql = "Table1 | join kind=rightanti Table2 on Id == Id";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("RIGHT ANTI JOIN");
    });

    test("should translate left semi join", () => {
      const kql = "Table1 | join kind=leftsemi Table2 on Id == Id";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LEFT SEMI JOIN");
    });

    test("should translate right semi join", () => {
      const kql = "Table1 | join kind=rightsemi Table2 on Id == Id";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("RIGHT SEMI JOIN");
    });

    test("should translate join with multiple conditions", () => {
      const kql =
        "Table1 | join kind=inner Table2 on Col1 == Col2, Col3 == Col4";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("INNER JOIN");
      expect(sql).toContain("AND");
      expect(sql).toContain("Table1.Col1 = Table2.Col2");
      expect(sql).toContain("Table1.Col3 = Table2.Col4");
    });

    test("should translate join in pipeline", () => {
      const kql =
        "Table1 | where Status == 'active' | join kind=inner Table2 on Id == UserId | project Name, Value";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain(
        "cte_0 AS (SELECT * FROM Table1 WHERE Status = 'active')"
      );
      expect(sql).toContain("INNER JOIN Table2");
      expect(sql).toContain("SELECT Name, Value FROM");
    });

    test("should translate default join as inner join", () => {
      const kql = "Table1 | join Table2 on Id == Id";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("INNER JOIN");
    });

    test("should translate top without order", () => {
      const kql = "Table | top 10";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LIMIT 10");
    });

    test("should translate top with ascending order", () => {
      const kql = "Table | top 5 by Score asc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ORDER BY Score ASC");
      expect(sql).toContain("LIMIT 5");
    });

    test("should translate top with descending order", () => {
      const kql = "Table | top 20 by Amount desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ORDER BY Amount DESC");
      expect(sql).toContain("LIMIT 20");
    });

    test("should translate top with default descending order", () => {
      const kql = "Table | top 15 by Value";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ORDER BY Value DESC");
      expect(sql).toContain("LIMIT 15");
    });

    test("should translate top in pipeline", () => {
      const kql = "Table | where Status == 'active' | top 10 by Score desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain(
        "cte_0 AS (SELECT * FROM Table WHERE Status = 'active')"
      );
      expect(sql).toContain("ORDER BY Score DESC");
      expect(sql).toContain("LIMIT 10");
    });

    test("should translate complex pipeline with top", () => {
      const kql =
        "Table | project Name, Score | where Score > 50 | top 5 by Score desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT Name, Score FROM Table");
      expect(sql).toContain("WHERE Score > 50");
      expect(sql).toContain("ORDER BY Score DESC");
      expect(sql).toContain("LIMIT 5");
    });

    test("should translate inner union", () => {
      const kql = "Table1 | union kind=inner Table2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT * FROM Table1");
      expect(sql).toContain("UNION");
      expect(sql).toContain("SELECT * FROM Table2");
      expect(sql).not.toContain("UNION ALL");
    });

    test("should translate outer union with all", () => {
      const kql = "Table1 | union kind=outer Table2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT * FROM Table1");
      expect(sql).toContain("UNION ALL");
      expect(sql).toContain("SELECT * FROM Table2");
    });

    test("should translate default union as inner", () => {
      const kql = "Table1 | union Table2";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UNION");
      expect(sql).not.toContain("UNION ALL");
    });

    test("should translate union with multiple tables", () => {
      const kql = "Table1 | union kind=inner Table2, Table3, Table4";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SELECT * FROM Table1");
      expect(sql).toContain("SELECT * FROM Table2");
      expect(sql).toContain("SELECT * FROM Table3");
      expect(sql).toContain("SELECT * FROM Table4");
      const unionCount = (sql.match(/UNION/g) || []).length;
      expect(unionCount).toBe(3);
    });

    test("should translate outer union with multiple tables", () => {
      const kql = "Table1 | union kind=outer Table2, Table3";
      const sql = kqlToDuckDB(kql);
      const unionAllCount = (sql.match(/UNION ALL/g) || []).length;
      expect(unionAllCount).toBe(2);
    });

    test("should translate substring function", () => {
      const kql = "Table | extend Sub = substring(Name, 0, 3)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SUBSTR");
    });

    test("should translate tolower function", () => {
      const kql = "Table | extend Lower = tolower(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LOWER");
    });

    test("should translate toupper function", () => {
      const kql = "Table | extend Upper = toupper(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UPPER");
    });

    test("should translate indexof function in extend", () => {
      const kql = "Table | extend Idx = indexof(Email, '@')";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("STRPOS");
    });

    test("should translate length function", () => {
      const kql = "Table | extend Len = length(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LENGTH");
    });

    test("should translate trim function", () => {
      const kql = "Table | extend Trimmed = trim(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("TRIM");
    });

    test("should translate ltrim function", () => {
      const kql = "Table | extend LTrimmed = ltrim(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LTRIM");
    });

    test("should translate rtrim function", () => {
      const kql = "Table | extend RTrimmed = rtrim(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("RTRIM");
    });

    test("should translate replace function", () => {
      const kql = "Table | extend Replaced = replace(Text, 'old', 'new')";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("REPLACE");
      expect(sql).toContain("'old'");
      expect(sql).toContain("'new'");
    });

    test("should translate reverse function", () => {
      const kql = "Table | extend Rev = reverse(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("REVERSE");
    });

    test("should translate split function", () => {
      const kql = "Table | extend Parts = split(Name, ' ')";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("STRING_SPLIT");
    });

    test("should use string functions in complex expression", () => {
      const kql =
        "Table | extend NameLen = length(Name), LowerName = tolower(Name)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LOWER");
      expect(sql).toContain("LENGTH");
    });
  });
});
