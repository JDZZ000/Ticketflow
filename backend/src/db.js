import "dotenv/config";
import pg from "pg";

// Un solo pool de conexiones compartido por toda la API
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
