export const DEFAULT_LOCALE = "ja";
export const SUPPORTED_LOCALES = ["ja", "en"] as const;
export const LOCALE_FALLBACK = { en: DEFAULT_LOCALE };

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  ja: "JA",
  en: "EN",
};

export const PUBLIC_TEXT_BY_LOCALE = {
  ja: {
    aboutLabel: "プロフィールとサイトについて",
    postsLabel: "投稿一覧",
    emptyPosts: "投稿はまだありません。",
    navLabel: "サイトナビゲーション",
    languageLabel: "言語切替",
    themeToggleLabel: "ダークモード",
    notFoundTitle: "404",
    notFoundMessage: "ページが見つかりませんでした。",
    notFoundHomeLink: "トップページへ戻る",
    translationNoteLabel: "翻訳注釈",
    translationNoteText: "この英語版は日本語の原文から自動翻訳されています。正本は日本語の記事です。",
    translationNoteSourceLink: "日本語の原文を読む",
  },
  en: {
    aboutLabel: "Profile and site information",
    postsLabel: "Posts",
    emptyPosts: "No posts yet.",
    navLabel: "Site navigation",
    languageLabel: "Language",
    themeToggleLabel: "Dark mode",
    notFoundTitle: "404",
    notFoundMessage: "Page not found.",
    notFoundHomeLink: "Back to home",
    translationNoteLabel: "Translation note",
    translationNoteText:
      "This English version was generated automatically from the Japanese original. The Japanese post is the canonical source.",
    translationNoteSourceLink: "Read the Japanese original",
  },
} as const;

export type PublicText = (typeof PUBLIC_TEXT_BY_LOCALE)[Locale];

export function getCurrentLocale(locale: string | undefined): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale ?? "") ? (locale as Locale) : DEFAULT_LOCALE;
}

export function getPublicText(locale: string | undefined): PublicText {
  return PUBLIC_TEXT_BY_LOCALE[getCurrentLocale(locale)];
}

export function getContentSlug(entry: { id?: unknown; slug?: unknown; data?: { slug?: unknown } }): string {
  const rawSlug = [entry.slug, entry.data?.slug, entry.id].find((value) => typeof value === "string");
  return normalizeContentSlug(typeof rawSlug === "string" ? rawSlug : "");
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10).replace(/-/g, ".");
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
