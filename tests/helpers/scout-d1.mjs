// Local test adapter executes the real migration and SQL using Node's SQLite, not a fake repository.
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
export function database(migration) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(migration, "utf8"));
  return {
    sqlite,
    prepare(sql) {
      const make = (values) => ({
        async first(column) {
          const row = sqlite.prepare(sql).get(...values);
          return column ? row?.[column] : row || null;
        },
        async all() {
          return { success: true, results: sqlite.prepare(sql).all(...values) };
        },
        async run() {
          const result = sqlite.prepare(sql).run(...values);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
        bind(...v) {
          return make(v);
        },
      });
      return make([]);
    },
  };
}
