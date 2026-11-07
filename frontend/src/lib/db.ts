import { createClient } from "@libsql/client";
import path from "path";

// In local development, we point directly to the SQLite file created by the Python engine.
// When deployed to production, this will point to the Turso cloud database URL.
const dbPath = process.env.TURSO_DATABASE_URL 
  ? process.env.TURSO_DATABASE_URL 
  : `file:${path.join(process.cwd(), "..", "painpoints.db")}`;

const authToken = process.env.TURSO_AUTH_TOKEN || "";

export const db = createClient({
  url: dbPath,
  authToken: authToken,
});
