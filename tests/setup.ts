import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../src/utils/env.js';

// Load environment variables from .env.test
config({ path: '.env.test' });

// Create a connection to the test database
const client = postgres(env.DATABASE_URL);

// Create a database instance
export const db = drizzle(client);

// Run migrations before tests
export async function setupTestDatabase() {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
}

// Clean up after tests
export async function cleanupTestDatabase() {
  // In a real implementation, you would clean up specific tables
  // For now, we'll just drop all tables and recreate them
  await client`DROP SCHEMA public CASCADE`;
  await client`CREATE SCHEMA public`;
  await client`GRANT ALL ON SCHEMA public TO postgres`;
  await client`GRANT ALL ON SCHEMA public TO public`;
}

// Close database connection
export async function closeDatabaseConnection() {
  await client.end();
}

// Set up test environment
export async function setupTestEnvironment() {
  await setupTestDatabase();
}

// Tear down test environment
export async function teardownTestEnvironment() {
  await cleanupTestDatabase();
  await closeDatabaseConnection();
}
