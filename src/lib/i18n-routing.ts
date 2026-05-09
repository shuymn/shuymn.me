import { getRelativeLocaleUrl } from "astro:i18n";
import { DEFAULT_LOCALE, getCurrentLocale, SUPPORTED_LOCALES } from "./i18n";

export function localizePath(path: string, locale?: string): string {
  const currentLocale = getCurrentLocale(locale);
  const normalizedPath = stripLocalePrefix(normalizeAbsolutePath(path));
  const relativePath = normalizedPath === "/" ? undefined : normalizedPath.replace(/^\/+/, "");

  return getRelativeLocaleUrl(currentLocale, relativePath);
}

export function getHomePath(locale?: string): string {
  return localizePath("/", locale);
}

export function getPostPath(slug: string, locale?: string): string {
  const normalizedSlug = normalizeContentSlug(slug);
  return localizePath(`/posts/${normalizedSlug}`, locale);
}

function normalizeAbsolutePath(path: string): string {
  if (!path) return "/";
  const absolutePath = path.startsWith("/") ? path : `/${path}`;
  return absolutePath.replace(/\/{2,}/g, "/");
}

function stripLocalePrefix(path: string): string {
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const prefix = `/${locale}`;
    if (path === prefix) return "/";
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length);
  }
  return path;
}

function normalizeContentSlug(slug: string): string {
  const trimmed = slug.replace(/^\/+|\/+$/g, "");
  return stripLocalePrefix(`/${trimmed}`).replace(/^\/+/, "");
}
