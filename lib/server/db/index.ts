import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
export const db = connectionString ? drizzle(postgres(connectionString, { max: 5 }), { schema }) : null;
export type Database = NonNullable<typeof db>;
export function requireDb(): Database { if (!db) throw new Error("DATABASE_URL is not configured"); return db; }
