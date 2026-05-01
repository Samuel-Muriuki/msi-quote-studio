import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import { sendVerifyEmail } from "@/lib/verify-email";

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
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24h
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendVerifyEmail({
          toEmail: user.email,
          toName: user.name,
          verifyUrl: url,
        });
      } catch (err) {
        // Don't block the signup flow if email dispatch fails — the user
        // can request a re-send from the sign-in page.
        console.error("[auth] verify email dispatch threw:", err);
      }
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  databaseHooks: {
    user: {
      update: {
        after: async (user, ctx) => {
          // Welcome email fires once, when emailVerified flips from false
          // to true (i.e. the user clicked the verification link). Before
          // that they don't have access to the app, so a "your workspace
          // is live" email would mislead.
          if (!user?.email || user.email === "demo@msi-quote-studio.com") return;
          if (!user.emailVerified) return;
          // Only send when this update is the verify event — Better Auth
          // surfaces the previous state via ctx.previous if available.
          // If it's not, we still send (the welcome email is idempotent
          // enough — a duplicate is harmless).
          const wasVerified =
            // @ts-expect-error - ctx shape varies by Better Auth version
            ctx?.previous?.emailVerified === true;
          if (wasVerified) return;
          try {
            await sendWelcomeEmail({ toEmail: user.email, toName: user.name });
          } catch (err) {
            console.error("[auth] welcome email threw:", err);
          }
        },
      },
    },
  },
});
