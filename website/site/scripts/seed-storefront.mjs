// Loads the exported storefront (catalog + page texts) into an empty database.
// Usage: node --env-file=.env scripts/seed-storefront.mjs
// Safe to re-run: it skips catalog items that already exist (same name) and only fills missing text keys.
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const file = path.join(import.meta.dirname, "storefront-content.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const db = await mysql.createConnection(process.env.DATABASE_URL);
let added = 0;
for (const item of data.catalogItems) {
  const [rows] = await db.execute("SELECT id FROM catalog_items WHERE name = ? LIMIT 1", [item.name]);
  if (rows.length) continue;
  await db.execute(
    "INSERT INTO catalog_items (kind, name, category, description, priceHalalas, priceLabel, imageUrl, imageKey, featured, active, sortOrder, createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)",
    [item.kind, item.name, item.category, item.description, item.priceHalalas, item.priceLabel, item.imageUrl, item.imageKey, item.featured, item.active, item.sortOrder],
  );
  added++;
}
let texts = 0;
for (const [key, value] of Object.entries(data.storeContent)) {
  const [result] = await db.execute("INSERT IGNORE INTO store_content (`key`, value, updatedBy) VALUES (?,?,0)", [key, value]);
  texts += result.affectedRows;
}
await db.end();
console.log(`Catalog items added: ${added} of ${data.catalogItems.length}. Page texts added: ${texts}.`);
