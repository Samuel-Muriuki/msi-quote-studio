import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Pool is constructed eagerly (Pool itself is lazy — it doesn't connect until
// the first query). We deliberately do NOT throw here when DATABASE_URL is
// missing: this module is loaded at build time when env vars may not be set,
// and throwing breaks `next build` page-data collection. Missing config will
// surface at request time when Better Auth makes its first query, which is
// the correct failure surface.
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
