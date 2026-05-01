"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  // Render BOTH icons and let CSS show the right one based on `html.dark`,
  // which next-themes sets before React mounts. The icon is therefore
  // correct from the first paint regardless of React state.
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Sun className="size-5 hidden dark:block" />
      <Moon className="size-5 dark:hidden" />
    </Button>
  );
}
