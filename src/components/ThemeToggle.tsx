import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from "../lib/theme";

type Theme = typeof DARK_THEME | typeof LIGHT_THEME;

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

type Props = {
  label: string;
};

function getStoredTheme(): Theme | null {
  let storedTheme: string | null;
  try {
    storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
  if (storedTheme === DARK_THEME || storedTheme === LIGHT_THEME) {
    return storedTheme;
  }
  return null;
}

function getSystemTheme(mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)): Theme {
  return mediaQuery.matches ? DARK_THEME : LIGHT_THEME;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

function persistTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the visible theme change even when persistent storage is unavailable.
  }
}

export default function ThemeToggle({ label }: Props) {
  const [resolvedTheme, setResolvedTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      applyTheme(storedTheme);
      setResolvedTheme(storedTheme);
      return;
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const syncSystemTheme = () => {
      if (getStoredTheme()) return;

      const theme = getSystemTheme(mediaQuery);
      applyTheme(theme);
      setResolvedTheme(theme);
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  if (!resolvedTheme) {
    return (
      <button type="button" className="theme-toggle" aria-label={label} disabled>
        <span className="theme-toggle-placeholder" />
      </button>
    );
  }

  const nextTheme = resolvedTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;

  return (
    <button
      type="button"
      onClick={() => {
        persistTheme(nextTheme);
        setResolvedTheme(nextTheme);
      }}
      className="theme-toggle"
      aria-label={label}
      aria-pressed={resolvedTheme === DARK_THEME}
    >
      {resolvedTheme === LIGHT_THEME ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
