import { existsSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";

const databasePath = resolve(process.cwd(), "data.db");

if (!existsSync(databasePath)) {
  process.exit(0);
}

const db = new Database(databasePath);

try {
  db.prepare("delete from options where name = ?").run("emdash:manifest_cache");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("no such table: options")) {
    throw error;
  }
} finally {
  db.close();
}
