import { describe, test, expect, beforeAll } from "bun:test";
import { parseKql, initParser, kqlToDuckDB } from "../src/index";
import { resolve } from "path";

describe("KQL Parser Integration", () => {
  beforeAll(async () => {
    // Resolve path to the WASM file from node_modules
    const wasmPath = resolve(
      import.meta.dir,
      "../../kql-parser/tree-sitter-kql.wasm"
    );
    const treeSitterWasmPath = resolve(
      import.meta.dir,
      "../node_modules/web-tree-sitter/tree-sitter.wasm"
    );
    await initParser(wasmPath, treeSitterWasmPath);
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

    test("should translate round function", () => {
      const kql = "Table | extend Rounded = round(Value, 2)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ROUND");
    });

    test("should translate floor function", () => {
      const kql = "Table | extend Floored = floor(Price)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("FLOOR");
    });

    test("should translate ceil function", () => {
      const kql = "Table | extend Ceiled = ceil(Price)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CEIL");
    });

    test("should translate abs function", () => {
      const kql = "Table | extend Absolute = abs(Difference)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ABS");
    });

    test("should translate sqrt function", () => {
      const kql = "Table | extend Root = sqrt(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SQRT");
    });

    test("should translate pow function", () => {
      const kql = "Table | extend Power = pow(Base, Exponent)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("POW");
    });

    test("should translate log function", () => {
      const kql = "Table | extend Logarithm = log(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LOG");
    });

    test("should translate log10 function", () => {
      const kql = "Table | extend Log10Value = log10(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LOG10");
    });

    test("should translate trigonometric functions", () => {
      const kql =
        "Table | extend S = sin(Angle), C = cos(Angle), T = tan(Angle)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("SIN");
      expect(sql).toContain("COS");
      expect(sql).toContain("TAN");
    });

    test("should translate math functions in extend", () => {
      const kql =
        "Table | extend AbsDiff = abs(Difference), Rounded = round(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("ABS");
      expect(sql).toContain("ROUND");
    });

    test("should translate tostring function", () => {
      const kql = "Table | extend AsString = tostring(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("VARCHAR");
    });

    test("should translate toint function", () => {
      const kql = "Table | extend AsInt = toint(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("INTEGER");
    });

    test("should translate todouble function", () => {
      const kql = "Table | extend AsDouble = todouble(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("DOUBLE");
    });

    test("should translate tobool function", () => {
      const kql = "Table | extend AsBool = tobool(Flag)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("BOOLEAN");
    });

    test("should translate tolong function", () => {
      const kql = "Table | extend AsLong = tolong(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("BIGINT");
    });

    test("should translate tofloat function", () => {
      const kql = "Table | extend AsFloat = tofloat(Value)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("FLOAT");
    });

    test("should translate todatetime function", () => {
      const kql = "Table | extend AsDateTime = todatetime(DateString)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("TIMESTAMP");
    });

    test("should translate totimespan function", () => {
      const kql = "Table | extend AsTimespan = totimespan(Duration)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("INTERVAL");
    });

    test("should use type conversions in expressions", () => {
      const kql = "Table | extend Converted = toint(Price) + 10";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("CAST");
      expect(sql).toContain("INTEGER");
    });

    test("should translate now function", () => {
      const kql = "Table | extend Now = now()";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("NOW()");
    });

    test("should translate ago with day unit", () => {
      const kql = "Table | extend Yesterday = ago(1d)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("NOW() - INTERVAL '1 day'");
    });

    test("should translate ago with hour unit", () => {
      const kql = "Table | extend LastHour = ago(1h)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("NOW() - INTERVAL '1 hour'");
    });

    test("should translate ago with minute unit", () => {
      const kql = "Table | extend LastMin = ago(30m)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("NOW() - INTERVAL '30 minute'");
    });

    test("should translate ago with second unit", () => {
      const kql = "Table | extend LastSec = ago(45s)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("NOW() - INTERVAL '45 second'");
    });

    test("should translate ago in where clause", () => {
      const kql = "Table | where Timestamp > ago(7d)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("Timestamp > NOW() - INTERVAL '7 day'");
    });

    test("should translate complex datetime expressions", () => {
      const kql = "Table | extend DaysAgo = ago(7d), CurrentTime = now()";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("NOW() - INTERVAL '7 day'");
      expect(sql).toContain("NOW()");
    });

    test("should use now and ago in pipeline", () => {
      const kql =
        "Table | where Created > ago(30d) | extend Age = now() - Created";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("NOW() - INTERVAL '30 day'");
      expect(sql).toContain("(NOW() - Created) AS Age");
    });

    test("should translate let with number", () => {
      const kql = "let threshold = 100; Table | where Value > threshold";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Value > (100)");
    });

    test("should translate let with string", () => {
      const kql = "let name = 'John'; Table | where Name == name";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Name = ('John')");
    });

    test("should translate multiple let statements", () => {
      const kql = "let a = 10; let b = 20; Table | extend Sum = a + b";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("(10)");
      expect(sql).toContain("(20)");
      expect(sql).toContain("AS Sum");
    });

    test("should translate let with expression", () => {
      const kql = "let double = 2 * 5; Table | extend Result = double + 10";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("(2 * 5)");
    });

    test("should translate let in where clause", () => {
      const kql = "let minAge = 18; Table | where Age >= minAge";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Age >= (18)");
    });

    test("should translate let with string function", () => {
      const kql = "let prefix = 'admin'; Table | where Username == prefix";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Username = ('admin')");
    });

    test("should translate let in complex pipeline", () => {
      const kql =
        "let threshold = 100; Table | where Value > threshold | extend Double = Value * 2 | top 5 by Double desc";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Value > (100)");
      expect(sql).toContain("(Value * 2)");
      expect(sql).toContain("ORDER BY Double DESC");
    });

    test("should translate mv-expand simple", () => {
      const kql = "Table | mv-expand Tags";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UNNEST(Tags)");
      expect(sql).toContain("expanded_value");
    });

    test("should translate mvexpand variant", () => {
      const kql = "Table | mvexpand Items";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UNNEST(Items)");
    });

    test("should translate mv-expand with limit", () => {
      const kql = "Table | mv-expand Tags limit 10";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UNNEST(Tags)");
      expect(sql).toContain("LIMIT 10");
    });

    test("should translate mv-expand with to typeof", () => {
      const kql = "Table | mv-expand Tags to typeof(string)";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UNNEST(Tags)");
    });

    test("should translate mv-expand in pipeline", () => {
      const kql =
        "Table | where Status == 'active' | mv-expand Tags | project Name, Tags";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Status = 'active'");
      expect(sql).toContain("UNNEST(Tags)");
      expect(sql).toContain("SELECT Name, Tags");
    });

    test("should translate mv-expand with function call", () => {
      const kql = "Table | mv-expand split(Tags, ',')";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UNNEST(STRING_SPLIT(Tags, ','))");
    });

    test("should translate mv-expand with limit and to typeof", () => {
      const kql = "Table | mv-expand Items to typeof(dynamic) limit 50";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("UNNEST(Items)");
      expect(sql).toContain("LIMIT 50");
    });

    test("should translate search in single column", () => {
      const kql = "Users | search in (Name) 'john'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE");
      expect(sql).toContain("LIKE");
      expect(sql).toContain("'%john%'");
    });

    test("should translate search in multiple columns", () => {
      const kql = "Users | search in (Name, Email) 'admin'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE");
      expect(sql).toContain("LIKE");
      expect(sql).toContain("OR");
      expect(sql).toContain("'%admin%'");
    });

    test("should translate search with special characters", () => {
      const kql = "Users | search in (Username) 'test@user'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("'%test@user%'");
    });

    test("should use case-insensitive search", () => {
      const kql = "Users | search in (Name) 'Admin'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("LOWER(Name) LIKE LOWER(");
    });

    test("should translate search in pipeline", () => {
      const kql =
        "Users | where Status == 'active' | search in (Name, Email) 'test' | project Name";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE Status = 'active'");
      expect(sql).toContain("LIKE");
      expect(sql).toContain("SELECT Name");
    });

    test("should translate search in three columns", () => {
      const kql = "Logs | search in (Message, Level, Source) 'error'";
      const sql = kqlToDuckDB(kql);
      expect(sql).toContain("WHERE");
      const likeCount = (sql.match(/LIKE/g) || []).length;
      expect(likeCount).toBeGreaterThanOrEqual(3);
      const orCount = (sql.match(/OR/g) || []).length;
      expect(orCount).toBeGreaterThanOrEqual(2);
    });
  });
});
