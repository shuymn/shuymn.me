# shuymn.me

個人ブログサイトのモノレポプロジェクト

## プロジェクト構造

```
/
└── apps/                       # アプリケーション群
    └── oldblog/                # 現行ブログアプリケーション (Next.js)
        ├── posts/              # Markdownコンテンツ
        ├── public/             # 静的アセット
        └── src/                # ソースコード
```

## 開発

```bash
# 全プロジェクトの依存関係をインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 移行プラン

- React Router/TailwindCSS/Hono/Cloudflare/microCMSへの移行
- JSライブラリからTypeScriptへの移行
- サーバーサイドレンダリングからSPAへの移行
