#!/usr/bin/env node

/**
 * Biomeコマンドへのシンプルなラッパー
 * このスクリプトは共通の設定でBiomeを実行するためのヘルパーです
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// コマンドライン引数を取得
const args = process.argv.slice(2);

// packages/biome-config/index.jsonの絶対パスを取得
const configPath = path.resolve(__dirname, "index.json");

// コマンドを構築 (configオプションを追加)
const command = [
  "npx", 
  "@biomejs/biome",
  args[0], // lint, format, check など
  args.slice(1).join(" "), // その他の引数
  "--config-path",
  configPath
].join(" ");

try {
  // コマンドを実行して出力を表示
  execSync(command, { stdio: "inherit" });
} catch (error) {
  process.exit(1);
}
