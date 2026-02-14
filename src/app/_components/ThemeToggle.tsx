"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // This is the standard pattern recommended by next-themes
  if (!resolvedTheme) {
    return (
      <button type="button" className="p-2 rounded-lg transition-colors" aria-label="Toggle theme" disabled>
        <div className="w-5 h-5" />
      </button>
    );
  }

  const nextTheme = resolvedTheme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="p-2 rounded-lg hover:bg-hover transition-colors text-foreground"
      aria-label={`Switch to ${nextTheme} mode`}
    >
      {resolvedTheme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
