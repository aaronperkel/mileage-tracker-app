import './load-env';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { resolveDatabaseConnection } from '../db/connection';

async function main() {
  const { url, authToken, isLocalFile } = resolveDatabaseConnection();
  const client = createClient({ url, authToken });

  await migrate(drizzle(client), { migrationsFolder: './drizzle' });

  console.log(`Migrations applied to ${isLocalFile ? url : 'remote Turso database'}.`);
  client.close();
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
