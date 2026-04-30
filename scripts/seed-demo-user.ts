/**
 * One-shot seed script: creates the demo estimator account so reviewers can
 * sign in without registering. Idempotent — safe to re-run; will report
 * "already exists" the second time.
 *
 * Usage:
 *   pnpm exec tsx --env-file=.env.local scripts/seed-demo-user.ts
 */

import { auth } from "../src/lib/auth";

const DEMO_EMAIL = "demo@msi-quote-studio.com";
const DEMO_PASSWORD = "demo-account-2026";
const DEMO_NAME = "Demo Estimator";

async function main() {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        name: DEMO_NAME,
      },
    });
    console.log("✅ Demo user created:", {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.toLowerCase().includes("already") ||
      message.toLowerCase().includes("exists") ||
      message.toLowerCase().includes("unique")
    ) {
      console.log(`ℹ️  Demo user already exists (${DEMO_EMAIL}); skipping.`);
      return;
    }
    console.error("❌ Failed to seed demo user:", message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
