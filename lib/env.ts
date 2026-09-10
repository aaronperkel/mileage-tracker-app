/*
 * Environment access.
 *
 * Every value is behind a getter. Reading at module scope would break
 * `next build`, which imports every route module — a missing secret would
 * become a build failure on a page that never touches it.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`);
  }
  return value;
}

export const env = {
  /** The single shared password. One person uses this app; there is no user table. */
  get appPassword(): string {
    return required('APP_PASSWORD');
  },
  /*
   * Session signing key, deliberately separate from the password: rotating the
   * password should be a deliberate act, not a silent logout.
   */
  get authSecret(): string {
    return required('AUTH_SECRET');
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
} as const;
