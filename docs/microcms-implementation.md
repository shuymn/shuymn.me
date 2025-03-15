# microCMS 実装計画

## 概要

現在のMarkdownファイルベースのコンテンツ管理からmicroCMSへの移行を行います。これにより、ブラウザーベースでのコンテンツ管理が可能になるほか、APIを通じたコンテンツの取得が可能になります。

## スキーマ設計

### 記事（articles）

| フィールド名 | タイプ | 必須 | 説明 |
|------------|------|-----|------|
| title | テキストフィールド | はい | 記事タイトル |
| content | リッチエディタ | はい | 記事の本文 |
| description | テキストエリア | いいえ | 記事の説明（メタ情報用） |
| slug | テキストフィールド | はい | URLスラッグ |
| publishedAt | 日時 | はい | 公開日時 |
| revisedAt | 日時 | いいえ | 更新日時 |
| eyecatch | 画像 | いいえ | アイキャッチ画像 |
| tags | 複数コンテンツ参照 | いいえ | 記事に紐づくタグ |

### タグ（tags）

| フィールド名 | タイプ | 必須 | 説明 |
|------------|------|-----|------|
| name | テキストフィールド | はい | タグ名 |
| slug | テキストフィールド | はい | URLスラッグ |

## コンテンツ移行スクリプト

既存のMarkdownファイルからmicroCMSへコンテンツを移行するスクリプトを作成します。

```typescript
// scripts/migrate-to-microcms.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from 'microcms-js-sdk';
import { remark } from 'remark';
import html from 'remark-html';

// microCMSクライアント初期化
const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN || '',
  apiKey: process.env.MICROCMS_API_KEY || '',
});

const POSTS_DIR = path.join(process.cwd(), 'apps/oldblog/posts');

// Markdownをリッチテキスト（HTML）に変換
async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

async function migrateContent() {
  const files = fs.readdirSync(POSTS_DIR);
  
  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    // ファイル名からスラッグを抽出 (2022-01-28-catch-up.md → catch-up)
    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/, '$1');
    
    // HTMLに変換
    const htmlContent = await markdownToHtml(content);
    
    try {
      // microCMSへの登録
      await client.create({
        endpoint: 'articles',
        content: {
          title: data.title,
          content: htmlContent,
          description: data.description || '',
          slug: slug,
          publishedAt: data.date,
        }
      });
      
      console.log(`Migrated: ${data.title}`);
    } catch (error) {
      console.error(`Failed to migrate ${file}:`, error);
    }
  }
}

migrateContent().catch(console.error);
```

## API設計

### 記事一覧取得API

```
GET /api/articles
```

クエリパラメータ：
- `limit`: 取得件数（デフォルト: 10）
- `offset`: スキップ件数
- `filters`: フィルタ条件（タグなど）

レスポンス例：
```json
{
  "contents": [
    {
      "id": "article-id-1",
      "title": "記事タイトル1",
      "description": "記事の説明1",
      "slug": "article-slug-1",
      "publishedAt": "2022-01-01T00:00:00.000Z",
      "revisedAt": "2022-01-02T00:00:00.000Z",
      "eyecatch": {
        "url": "https://images.microcms-assets.io/...",
        "width": 800,
        "height": 600
      }
    },
    ...
  ],
  "totalCount": 100,
  "limit": 10,
  "offset": 0
}
```

### 記事詳細取得API

```
GET /api/articles/:slug
```

レスポンス例：
```json
{
  "id": "article-id-1",
  "title": "記事タイトル1",
  "content": "<p>記事の本文...</p>",
  "description": "記事の説明1",
  "slug": "article-slug-1",
  "publishedAt": "2022-01-01T00:00:00.000Z",
  "revisedAt": "2022-01-02T00:00:00.000Z",
  "eyecatch": {
    "url": "https://images.microcms-assets.io/...",
    "width": 800,
    "height": 600
  },
  "tags": [
    {
      "id": "tag-id-1",
      "name": "タグ1",
      "slug": "tag-1"
    }
  ]
}
```

## 実装ステップ

1. microCMSアカウント作成とAPIキー取得
2. スキーマ定義の作成
3. 移行スクリプトの実装と実行
4. Hono APIの実装
   - 記事一覧取得API
   - 記事詳細取得API
5. フロントエンドからのAPI連携確認
