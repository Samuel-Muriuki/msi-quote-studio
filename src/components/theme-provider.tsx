"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injects an inline script that runs before React hydrates and
// before the first paint, so the dark class is set on <html> in time to style
// streaming Suspense fallbacks correctly. Our previous custom implementation
// relied on a script in app/layout.tsx that Turbopack dev sometimes failed to
// execute before the skeleton paint, producing a multi-second flash.
//
// Storage key kept stable so existing users keep their preference.
export const THEME_STORAGE_KEY = "msi-quote-studio.theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";
