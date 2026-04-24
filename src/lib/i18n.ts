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
    notFoundTitle: "404",
    notFoundMessage: "ページが見つかりませんでした。",
    notFoundHomeLink: "トップページへ戻る",
  },
  en: {
    aboutLabel: "Profile and site information",
    postsLabel: "Posts",
    emptyPosts: "No posts yet.",
    navLabel: "Site navigation",
    languageLabel: "Language",
    notFoundTitle: "404",
    notFoundMessage: "Page not found.",
    notFoundHomeLink: "Back to home",
  },
} as const;

export const HOME_ABOUT_SLUG = "home-about";

export function getCurrentLocale(locale: string | undefined): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale ?? "") ? (locale as Locale) : DEFAULT_LOCALE;
}

export function getPublicText(locale: string | undefined) {
  return PUBLIC_TEXT_BY_LOCALE[getCurrentLocale(locale)];
}

export function getHomePath(): string {
  return "/";
}

export function getPostPath(slug: string): string {
  return `/posts/${slug}`;
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10).replace(/-/g, ".");
}
