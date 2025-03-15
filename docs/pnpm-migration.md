# pnpmへの移行手順

## 概要

npmからpnpmへのパッケージマネージャ移行を実施します。pnpmはディスク効率が良く、モノレポ対応が充実しているため採用します。

## 実施手順

### 1. pnpmのインストール

```bash
npm install -g pnpm
```

### 2. ワークスペース設定ファイルの作成

`pnpm-workspace.yaml`を作成し、ワークスペースを設定します：

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'api/*'
```

### 3. package.jsonの更新

ルートのpackage.jsonを更新し、pnpm用の設定を追加：

```json
{
  "name": "shuymn-monorepo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "packageManager": "pnpm@7.x",
  "devDependencies": {
    "turbo": "^1.10.0"
  }
}
```

### 4. lock fileの更新

```bash
# package-lock.jsonを削除
rm -f package-lock.json

# pnpm-lock.yamlを生成
pnpm install
```

### 5. .npmrcファイルの作成

```
node-linker=hoisted
shamefully-hoist=true
```

### 6. エディタ設定の更新

VSCodeの場合、`.vscode/settings.json`を作成：

```json
{
  "npm.packageManager": "pnpm"
}
```

### 7. CIパイプライン更新

GitHub Actionsの場合、`.github/workflows/ci.yml`を作成：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 7
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
```

## 検証項目

- [ ] pnpmコマンドで依存関係のインストールが成功すること
- [ ] すべてのワークスペースでビルドが成功すること
- [ ] CI/CDパイプラインが正常に動作すること
- [ ] 既存のoldblogアプリが以前と同様に動作すること
