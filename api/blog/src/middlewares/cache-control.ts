import type { MiddlewareHandler } from 'hono';

type CacheControlOptions = {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  private?: boolean;
  immutable?: boolean;
};

/**
 * Cache-Controlヘッダーを設定するミドルウェア
 */
export const cacheControl = (options: CacheControlOptions): MiddlewareHandler => {
  const {
    maxAge = 0,
    sMaxAge,
    staleWhileRevalidate,
    private: isPrivate = false,
    immutable = false,
  } = options;

  return async (c, next) => {
    await next();
    
    // レスポンスに既にCache-Controlヘッダーがある場合は上書きしない
    if (c.res.headers.get('Cache-Control')) {
      return;
    }

    // Cache-Controlディレクティブの配列を構築
    const directives: string[] = [];

    // max-age
    if (maxAge > 0) {
      directives.push(`max-age=${maxAge}`);
    } else if (maxAge === 0) {
      directives.push('no-cache');
    }

    // s-maxage (CDNキャッシュ用)
    if (sMaxAge !== undefined && sMaxAge > 0) {
      directives.push(`s-maxage=${sMaxAge}`);
    }

    // stale-while-revalidate
    if (staleWhileRevalidate !== undefined && staleWhileRevalidate > 0) {
      directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    // private/public
    if (isPrivate) {
      directives.push('private');
    } else {
      directives.push('public');
    }

    // immutable
    if (immutable) {
      directives.push('immutable');
    }

    // Cache-Controlヘッダーをセット
    if (directives.length > 0) {
      c.header('Cache-Control', directives.join(', '));
    }
  };
};
