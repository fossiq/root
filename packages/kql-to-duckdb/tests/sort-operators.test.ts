import { describe, test, expect } from "bun:test";
import { kqlToDuckDB } from "../src/index";

describe("Sort/order operators", () => {
  test("sort by col desc", () => {
    expect(kqlToDuckDB("Users | sort by name desc")).toContain(
      "ORDER BY name DESC"
    );
  });

  test("sort by col asc", () => {
    expect(kqlToDuckDB("Users | sort by name asc")).toContain(
      "ORDER BY name ASC"
    );
  });

  test("sort without direction defaults to ASC", () => {
    expect(kqlToDuckDB("Users | sort by name")).toContain("ORDER BY name ASC");
  });

  test("sort without by keyword", () => {
    expect(kqlToDuckDB("Users | sort name desc")).toContain(
      "ORDER BY name DESC"
    );
  });

  test("order by col desc", () => {
    expect(kqlToDuckDB("Users | order by name desc")).toContain(
      "ORDER BY name DESC"
    );
  });

  test("order by col asc", () => {
    expect(kqlToDuckDB("Users | order by name asc")).toContain(
      "ORDER BY name ASC"
    );
  });

  test("sort multiple columns with mixed directions", () => {
    const sql = kqlToDuckDB("Users | sort by name asc, age desc");
    expect(sql).toContain("ORDER BY name ASC, age DESC");
  });

  test("top by col desc", () => {
    const sql = kqlToDuckDB("Users | top 5 by score desc");
    expect(sql).toContain("ORDER BY score DESC");
    expect(sql).toContain("LIMIT 5");
  });
});
