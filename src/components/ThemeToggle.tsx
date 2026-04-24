import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from "../lib/theme";

type Theme = typeof DARK_THEME | typeof LIGHT_THEME;

function getResolvedTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === DARK_THEME || storedTheme === LIGHT_THEME) {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export default function ThemeToggle() {
  const [resolvedTheme, setResolvedTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const theme = getResolvedTheme();
    applyTheme(theme);
    setResolvedTheme(theme);
  }, []);

  if (!resolvedTheme) {
    return (
      <button type="button" className="theme-toggle" aria-label="Toggle theme" disabled>
        <span className="theme-toggle-placeholder" />
      </button>
    );
  }

  const nextTheme = resolvedTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(nextTheme);
        setResolvedTheme(nextTheme);
      }}
      className="theme-toggle"
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={resolvedTheme === DARK_THEME}
    >
      {resolvedTheme === LIGHT_THEME ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
