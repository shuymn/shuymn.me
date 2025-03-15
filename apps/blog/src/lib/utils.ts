import type { MetaData, Post } from './types';

/**
 * 日付をフォーマットする
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 記事の公開日と更新日を比較し、更新されていれば更新日を返す
 */
export function getPublishAndUpdateDates(post: Post): { publishDate: string; updateDate?: string } {
  const publishDate = formatDate(post.publishedAt);
  const updatedDate = formatDate(post.updatedAt);
  
  // 公開日と更新日が同じ場合は更新日を返さない
  if (publishDate === updatedDate) {
    return { publishDate };
  }
  
  return { publishDate, updateDate: updatedDate };
}

/**
 * メタデータを生成する
 */
export function generateMetadata(
  title: string,
  description: string,
  path: string,
  options?: Partial<MetaData>
): MetaData {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://shuymn.me';
  const url = `${baseUrl}${path}`;
  
  return {
    title: `${title} | shuymn.me`,
    description,
    url,
    image: `${baseUrl}/ogp.png`,
    type: 'article',
    siteName: 'shuymn.me',
    twitterCard: 'summary_large_image',
    ...options,
  };
}

/**
 * マークダウンの内容からタイトルやdescriptionを抽出する
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength) + '...';
}

/**
 * スラッグ（URLフレンドリーな文字列）を生成する
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
