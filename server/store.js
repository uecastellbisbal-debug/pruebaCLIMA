// Minimal file-backed JSON store for survey responses.
// No native dependencies (no SQLite build step) so the project runs anywhere Node runs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, "db");
const DB_FILE = path.join(DB_DIR, "responses.json");

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]", "utf-8");
}

let writeQueue = Promise.resolve();

export function readAll() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export function append(record) {
  ensureDb();
  // Serialize writes so concurrent submissions never clobber each other.
  writeQueue = writeQueue.then(() => {
    const all = readAll();
    all.push(record);
    fs.writeFileSync(DB_FILE, JSON.stringify(all, null, 2), "utf-8");
    return record;
  });
  return writeQueue;
}

export function getById(id) {
  return readAll().find((r) => r.id === id) || null;
}
