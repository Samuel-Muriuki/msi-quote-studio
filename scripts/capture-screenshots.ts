/**
 * One-shot screenshot capture for the README + Loom assets.
 *
 *   pnpm exec tsx scripts/capture-screenshots.ts          # uses cached auth state
 *   pnpm exec tsx scripts/capture-screenshots.ts --seed   # forces fresh sign-in
 *
 * Drops PNGs into docs/screenshots/ matching the names referenced in the
 * README. Walks every key page at 1440x900 dark, then a couple at 1440x900
 * light, then resizes to 414x896 for the mobile shots.
 *
 * Auth strategy: a single seed step signs in as the demo user once and
 * persists Better Auth's session cookie + next-themes localStorage to
 * scripts/.playwright-auth.json. Every subsequent context is opened with
 * `storageState: <that path>`, so no further sign-ins are needed and the
 * session never gets invalidated mid-run.
 *
 * BASE_URL defaults to localhost:3000; override via env when needed.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { existsSync, statSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.resolve(process.cwd(), "docs/screenshots");
const AUTH_STATE_PATH = path.resolve(process.cwd(), "scripts/.playwright-auth.json");
const AUTH_STATE_TTL_MS = 30 * 60_000;

const FORCE_SEED = process.argv.includes("--seed");

async function ensureDir() {
  await mkdir(OUT_DIR, { recursive: true });
}

function authStateIsFresh() {
  if (!existsSync(AUTH_STATE_PATH)) return false;
  return Date.now() - statSync(AUTH_STATE_PATH).mtimeMs < AUTH_STATE_TTL_MS;
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("msi-quote-studio.theme", t);
    } catch {}
  }, theme);
}

async function signInAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.getByRole("button", { name: /Sign in as demo/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
}

async function seedAuthState(browser: Browser) {
  console.log("→ Seeding auth state");
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await setTheme(page, "dark");
  await signInAsDemo(page);
  await context.storageState({ path: AUTH_STATE_PATH });
  await context.close();
  console.log(`  ✓ auth state saved to ${path.relative(process.cwd(), AUTH_STATE_PATH)}`);
}

async function shoot(page: Page, url: string, filename: string, options?: {
  fullPage?: boolean;
  waitFor?: string;
  beforeShot?: (p: Page) => Promise<void>;
  delayMs?: number;
}) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  if (options?.waitFor) {
    await page.waitForSelector(options.waitFor, { timeout: 10_000 }).catch(() => {});
  }
  if (options?.beforeShot) {
    await options.beforeShot(page);
  }
  await page.waitForTimeout(options?.delayMs ?? 800);
  const filePath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: options?.fullPage ?? false });
  console.log(`  ✓ ${filename}`);
}

async function newAuthedContext(browser: Browser, opts: {
  viewport: { width: number; height: number };
  deviceScaleFactor?: number;
  colorScheme: "light" | "dark";
  isMobile?: boolean;
  hasTouch?: boolean;
}): Promise<BrowserContext> {
  return browser.newContext({
    ...opts,
    storageState: AUTH_STATE_PATH,
  });
}

async function captureDesktopDark(browser: Browser) {
  console.log("\n→ Desktop dark");
  // Public pages first — no auth required.
  const publicCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const publicPage = await publicCtx.newPage();
  await setTheme(publicPage, "dark");
  await shoot(publicPage, "/", "landing-hero-dark.png");
  await publicCtx.close();

  // Authed pages.
  const ctx = await newAuthedContext(browser, {
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await setTheme(page, "dark");

  await shoot(page, "/dashboard", "dashboard.png");
  await shoot(page, "/quotes", "quotes-pipeline.png", { delayMs: 1500 });
  await shoot(page, "/quotes/6495ee2a-3627-4352-986d-9750277ea8d8", "quote-detail.png", {
    delayMs: 2000,
  });

  // New quote — pristine, then autofill on the SAME page.
  await page.goto(`${BASE_URL}/quotes/new`, { waitUntil: "load", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForSelector("text=Customer name", { timeout: 30_000 }).catch(async () => {
    console.log("    [debug] customer-name not found; capturing what's there");
    await page.screenshot({ path: path.join(OUT_DIR, "_debug-new-quote.png") });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "new-quote-empty.png") });
  console.log("  ✓ new-quote-empty.png");

  const autofillButton = page.locator(
    'button:has-text("Autofill demo data"), button:has-text("Autofill")',
  );
  await autofillButton.first().click({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "new-quote-autofilled.png") });
  console.log("  ✓ new-quote-autofilled.png");

  await shoot(page, "/customers", "customers-list.png");

  // Customer detail — click the Cisco customer card.
  await page.goto(`${BASE_URL}/customers`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator('a[href^="/customers/"]', { hasText: "Cisco Systems" }).first().click();
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, "customer-detail.png") });
  console.log("  ✓ customer-detail.png");

  await shoot(page, "/reports", "reports.png", { delayMs: 2500 });
  await shoot(page, "/settings", "settings.png", { delayMs: 1500 });

  await ctx.close();
}

async function captureDesktopLight(browser: Browser) {
  console.log("\n→ Desktop light");

  // Public landing in light mode.
  const publicCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const publicPage = await publicCtx.newPage();
  await setTheme(publicPage, "light");
  await shoot(publicPage, "/", "landing-hero-light.png");
  await publicCtx.close();

  // One authed page in light mode for variety.
  const ctx = await newAuthedContext(browser, {
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  await setTheme(page, "light");
  await shoot(page, "/quotes/6495ee2a-3627-4352-986d-9750277ea8d8", "quote-detail-light.png", {
    delayMs: 1500,
  });
  await ctx.close();
}

async function captureMobile(browser: Browser) {
  console.log("\n→ Mobile dark");

  // Mobile landing — public.
  const publicCtx = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    isMobile: true,
    hasTouch: true,
  });
  const publicPage = await publicCtx.newPage();
  await setTheme(publicPage, "dark");
  await shoot(publicPage, "/", "mobile-landing.png");
  await publicCtx.close();

  // Mobile authed pages.
  const ctx = await newAuthedContext(browser, {
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await setTheme(page, "dark");

  await shoot(page, "/quotes/6495ee2a-3627-4352-986d-9750277ea8d8", "mobile-quote-detail.png", {
    delayMs: 1500,
  });
  await shoot(page, "/customers", "mobile-customers.png");
  await shoot(page, "/quotes/new", "mobile-new-quote.png", {
    delayMs: 1200,
    beforeShot: async (p) => {
      await p
        .getByRole("button", { name: /Autofill demo data/i })
        .click()
        .catch(() => {});
      await p.waitForTimeout(600);
    },
  });

  await ctx.close();
}

(async () => {
  await ensureDir();
  console.log(`Capturing to ${OUT_DIR}`);
  console.log(`BASE_URL = ${BASE_URL}`);
  const browser = await chromium.launch({ headless: true });
  try {
    if (FORCE_SEED || !authStateIsFresh()) {
      if (FORCE_SEED && existsSync(AUTH_STATE_PATH)) {
        await rm(AUTH_STATE_PATH);
      }
      await seedAuthState(browser);
    } else {
      console.log(`→ Reusing cached auth state (${path.relative(process.cwd(), AUTH_STATE_PATH)})`);
    }

    await captureDesktopDark(browser);
    await captureDesktopLight(browser);
    await captureMobile(browser);
  } finally {
    await browser.close();
  }
  console.log(`\n✓ Done. Files in docs/screenshots/`);
})();
