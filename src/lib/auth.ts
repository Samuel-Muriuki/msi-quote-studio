import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendWelcomeEmail } from "@/lib/welcome-email";

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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Best-effort welcome email. The shared demo account doesn't get
          // re-created so it's safe to fire on every user.create — but we
          // skip when the email is the demo seed for belt-and-braces.
          if (!user?.email || user.email === "demo@msi-quote-studio.com") {
            return;
          }
          try {
            await sendWelcomeEmail({ toEmail: user.email, toName: user.name });
          } catch (err) {
            // Never block registration on email failure.
            console.error("[auth] welcome email threw:", err);
          }
        },
      },
    },
  },
});
