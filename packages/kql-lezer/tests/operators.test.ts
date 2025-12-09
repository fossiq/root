import { describe, test, expect } from "vitest";
import { isValid } from "./_helpers";

describe("KQL operators - Basic support", () => {
  test("basic table reference", () => {
    expect(isValid("Users")).toBe(true);
  });

  test("identifiers with where clauses", () => {
    expect(isValid("Users | where status == active")).toBe(true);
    expect(isValid('Events | where type == "error"')).toBe(true);
  });

  test("multiple tokens with pipes", () => {
    // Current minimal grammar supports basic token sequences with pipes
    expect(isValid("Users | Events")).toBe(true);
    expect(isValid("Users | 42 | Events")).toBe(true);
  });
});

describe("Pipe operator support", () => {
  test("single pipe with identifiers", () => {
    expect(isValid("Users | Events")).toBe(true);
  });

  test("pipe chaining identifiers", () => {
    expect(isValid("Users | Events")).toBe(true);
    expect(isValid("Table1 | Table2")).toBe(true);
  });

  test("pipe with where clauses", () => {
    expect(isValid('Events | where type == "error" | Logs')).toBe(true);
  });

  test("multiple pipes (chained)", () => {
    expect(isValid("Users | Events | Logs")).toBe(true);
  });

  test("multiple pipes with mixed literals", () => {
    expect(isValid("Users | 42 | Events")).toBe(true);
  });

  test("pipe with complex identifiers", () => {
    expect(isValid("UsersTable | EventsLog")).toBe(true);
  });
});

describe("Where operator", () => {
  test("simple comparison", () => {
    expect(isValid("Users | where age > 18")).toBe(true);
    expect(isValid("Users | where count >= 100")).toBe(true);
    expect(isValid("Users | where status == active")).toBe(true);
    expect(isValid('Users | where name == "john"')).toBe(true);
  });

  test("logical and", () => {
    expect(isValid('Users | where age > 18 and status == "active"')).toBe(true);
    expect(isValid("Users | where a == 1 and b == 2 and c == 3")).toBe(true);
  });

  test("logical or", () => {
    expect(isValid("Users | where age > 18 or age < 5")).toBe(true);
    expect(isValid("Users | where a == 1 or b == 2 or c == 3")).toBe(true);
  });

  test("logical not", () => {
    expect(isValid("Users | where not active")).toBe(true);
    expect(isValid("Users | where not deleted")).toBe(true);
  });

  test("parenthesized expressions", () => {
    expect(isValid("Users | where (age > 18)")).toBe(true);
    expect(
      isValid(
        'Users | where age > 18 and (status == "active" or role == "admin")'
      )
    ).toBe(true);
  });

  test("string comparison operators", () => {
    expect(isValid('Users | where name contains "john"')).toBe(true);
    expect(isValid('Users | where name startswith "j"')).toBe(true);
    expect(isValid('Users | where name endswith "n"')).toBe(true);
    expect(isValid('Users | where name has "test"')).toBe(true);
  });

  test("chained where clauses", () => {
    expect(isValid('Users | where age > 18 | where status == "active"')).toBe(
      true
    );
  });
});

describe("Project operator", () => {
  test("single column", () => {
    expect(isValid("Users | project name")).toBe(true);
  });

  test("multiple columns", () => {
    expect(isValid("Users | project name, age")).toBe(true);
    expect(isValid("Users | project name, age, status")).toBe(true);
  });

  test("column with alias", () => {
    expect(isValid("Users | project fullName = name")).toBe(true);
  });

  test("column with computed expression", () => {
    expect(isValid("Users | project name, isAdult = age > 18")).toBe(true);
  });

  test("chained with where", () => {
    expect(isValid("Users | where age > 18 | project name")).toBe(true);
    expect(
      isValid("Users | where active | project name, age | where age > 21")
    ).toBe(true);
  });
});

describe("Extend operator", () => {
  test("single column", () => {
    expect(isValid("Users | extend fullName = name")).toBe(true);
  });

  test("multiple columns", () => {
    expect(isValid("Users | extend fullName = name, isAdult = age > 18")).toBe(
      true
    );
  });
});

describe("Sort operator", () => {
  test("simple sort", () => {
    expect(isValid("Users | sort name")).toBe(true);
    expect(isValid("Users | sort by name")).toBe(true);
  });

  test("sort with direction", () => {
    expect(isValid("Users | sort name asc")).toBe(true);
    expect(isValid("Users | sort by name desc")).toBe(true);
  });

  test("sort multiple columns", () => {
    expect(isValid("Users | sort name, age desc")).toBe(true);
  });
});

describe("Limit and take operators", () => {
  test("limit", () => {
    expect(isValid("Users | limit 10")).toBe(true);
  });

  test("take", () => {
    expect(isValid("Users | take 100")).toBe(true);
  });
});

describe("Top operator", () => {
  test("top with count", () => {
    expect(isValid("Users | top 10 by age")).toBe(true);
  });

  test("top with direction", () => {
    expect(isValid("Users | top 5 by score desc")).toBe(true);
  });
});

describe("Distinct operator", () => {
  test("single column", () => {
    expect(isValid("Events | distinct EventType")).toBe(true);
  });

  test("multiple columns", () => {
    expect(isValid("Events | distinct EventType, Source")).toBe(true);
  });
});

describe("Summarize operator", () => {
  test("simple aggregation", () => {
    expect(isValid("Events | summarize count()")).toBe(true);
  });

  test("aggregation with by clause", () => {
    expect(isValid("Events | summarize count() by EventType")).toBe(true);
  });

  test("aggregation with alias", () => {
    expect(isValid("Events | summarize total = sum(Amount) by Category")).toBe(
      true
    );
  });

  test("multiple aggregations", () => {
    expect(
      isValid("Events | summarize count(), avg(Duration) by EventType, Source")
    ).toBe(true);
  });
});

describe("Complex chained queries", () => {
  test("where + sort + limit", () => {
    expect(isValid("Users | where age > 18 | sort by name | limit 10")).toBe(
      true
    );
  });

  test("where + summarize + sort", () => {
    expect(
      isValid(
        'Events | where type == "error" | summarize count() by Source | sort by count desc'
      )
    ).toBe(true);
  });
});
