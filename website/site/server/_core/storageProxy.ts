import type { Express } from "express";
import fs from "node:fs";
import { storagePath } from "../storage";

// Serves uploaded files from the local upload folder at /manus-storage/{key}.
export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    const file = key ? storagePath(key) : null;
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.status(404).send("Not found");
      return;
    }
    res.set("Cache-Control", "public, max-age=86400");
    res.sendFile(file);
  });
}
