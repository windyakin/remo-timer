# CLAUDE.md

このファイルは Claude Code（claude.ai/code）がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Remo Timer は Nature Remo デバイスを使用した家電スケジュール制御システムです。Vue 3 フロントエンドと Hono バックエンドで構成されるフルスタック TypeScript アプリケーションです。

## 開発コマンド

```bash
# 初期セットアップ
npm run setup

# 開発サーバー起動（フロント + バック 並列）
npm run dev

# 個別起動
npm run dev:backend   # バックエンド (localhost:3000)
npm run dev:frontend  # フロントエンド (localhost:5173)

# ビルド
npm run build
npm run build:backend
npm run build:frontend

# DBマイグレーション
npm run db:migrate
npm run db:migrate:revert
```

## アーキテクチャ

### 通信構成

フロントエンドとバックエンドは**同一ドメイン**で提供されることを前提としています。

- フロントエンドからバックエンド API へのアクセスは `/api` パスへのリバースプロキシ経由
- 開発時: Vite の proxy 機能で `localhost:5173/api` → `localhost:3000/api`
- 本番時: Nginx でリバースプロキシ設定（`frontend/default.conf.template`）
- CORS 設定は同一オリジンを前提としているため、別ドメインでの運用は非推奨

### バックエンド (`backend/`)

- **フレームワーク**: Hono + TypeScript
- **ランタイム**: Node.js (@hono/node-server)
- **ORM**: TypeORM with SQLite
- **スケジューラ**: node-cron（繰り返し）+ setTimeout（一度きり）
- **認証**: openid-client (Auth0, オプション)

主要ディレクトリ:
- `src/entities/` - TypeORM エンティティ（Schedule, ExecutionLog, ApplianceCache）
- `src/services/` - ビジネスロジック（NatureApiService, SchedulerService）
- `src/routes/` - API ルート定義
- `src/migrations/` - DBマイグレーション

### フロントエンド (`frontend/`)

- **フレームワーク**: Vue 3 + TypeScript
- **ビルド**: Vite
- **UI**: PrimeVue (Aura テーマ) + PrimeFlex
- **認証**: @auth0/auth0-vue (オプション)

主要ディレクトリ:
- `src/views/` - ページコンポーネント
- `src/components/` - 再利用可能コンポーネント
- `src/services/api.ts` - API クライアント
- `src/types/` - 型定義

## 重要なコード規約

### TypeScript
- 厳格な型チェックを使用
- `any` の使用を避け、適切な型定義を行う

### API レスポンス
- Nature API の型は `backend/src/types/nature.ts` で定義
- フロントエンドの型は `frontend/src/types/index.ts` で定義

### スケジュール実行
- 「繰り返し」: Cron式で node-cron がジョブを管理
- 「一度きり」: setTimeout で実行後、スケジュールを自動削除

### 環境変数
- バックエンド: `.env` ファイル（`NATURE_API_TOKEN` が必須）
- フロントエンド: `VITE_` プレフィックスの環境変数

## データベース

SQLite を使用。スキーマは TypeORM マイグレーションで管理。

テーブル:
- `schedules` - スケジュール定義
- `execution_logs` - 実行履歴
- `appliance_cache` - 家電情報キャッシュ

## Docker

- `docker-compose.yml` でフロント/バック両方を起動
- バックエンド: Node.js 22 ベース
- フロントエンド: Nginx でサーブ
- GitHub Actions で ghcr.io へ自動プッシュ
