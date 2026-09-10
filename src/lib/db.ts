import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import env from "../../env.config";

if (!env.DATABASE_URL) {
	throw new Error("DATABASE_URL must be set before using the Drizzle database");
}

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql);
