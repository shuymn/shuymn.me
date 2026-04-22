"use client";

import dynamic from "next/dynamic";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function ThemeToggleInner() {
  const { resolvedTheme, setTheme } = useTheme();

  if (!resolvedTheme) {
    return <ThemeToggleLoading />;
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

function ThemeToggleLoading() {
  return (
    <button type="button" className="p-2 rounded-lg transition-colors" aria-label="Toggle theme" disabled>
      <div className="w-5 h-5" />
    </button>
  );
}

export default dynamic(() => Promise.resolve({ default: ThemeToggleInner }), {
  ssr: false,
  loading: ThemeToggleLoading,
});
