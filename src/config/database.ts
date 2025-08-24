import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/migrations/001_initial_schema.js';
import postgres from 'postgres';
import { env } from '../utils/env.js';

// Create a PostgreSQL connection
const connectionString = env.DATABASE_URL;

// Create a connection pool
const client = postgres(connectionString, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 1, // For development, use 1 connection
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Database connection health check
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Close database connection
export async function closeDatabaseConnection() {
  try {
    await client.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}
