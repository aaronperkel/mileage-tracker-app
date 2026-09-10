import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { resolveDatabaseConnection } from './connection';
import * as schema from './schema';

/*
 * The client is built on first use, not at module scope.
 *
 * `next build` imports every route module. A module-scope client turns a
 * missing environment variable into a build failure on a route that never
 * touches the database. A Proxy wrapper would hide that, but breaks anything
 * that introspects properties — so a plain function it is.
 */

function createDb() {
  const { url, authToken } = resolveDatabaseConnection();
  return drizzle(createClient({ url, authToken }), { schema });
}

export type Db = ReturnType<typeof createDb>;

let instance: Db | null = null;

export function getDb(): Db {
  instance ??= createDb();
  return instance;
}

export * from './schema';
