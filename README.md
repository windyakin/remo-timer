# Remo Timer

Nature Remo デバイスを使用した家電のスケジュール制御システムです。

公式アプリで「繰り返し」スケジュールの設定はできますが、「一度きり」のタイマー設定ができないので、それを補います。

## 機能

- **スケジュール管理**: 「一度きり」または「繰り返し」（Cron式）でスケジュール実行
- **家電制御**: エアコン（温度・風量・モード）、テレビ、照明、赤外線信号
- **実行ログ**: スケジュール実行履歴と結果の確認
- **認証**: Auth0 による JWT 認証（オプション）

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Vue 3, TypeScript, PrimeVue, Vite |
| バックエンド | Node.js, Express, TypeScript, TypeORM |
| データベース | SQLite |
| 認証 | Auth0 (オプション) |
| インフラ | Docker, Docker Compose, GitHub Actions |

## アーキテクチャ

フロントエンドとバックエンドは**同一ドメイン**で提供されることを前提としています。

```
ブラウザ
  ↓
[フロントエンド (Nginx / Vite)]
  │
  ├── 静的ファイル → そのまま配信
  │
  └── /api/* → [バックエンド (Express)] → Nature API
```

- 開発時: Vite の proxy 機能で `/api` をバックエンドへ転送
- 本番時: Nginx でリバースプロキシ（`frontend/default.conf.template`）

## セットアップ

### 必要要件

- Node.js 22+
- npm
- Docker / Docker Compose（コンテナ実行時）

### Nature API トークンの取得

1. [Nature Developer Portal](https://home.nature.global/) にアクセス
2. ログインして「Generate access token」でトークンを発行

### ローカル開発

```bash
# 依存関係のインストールとDB初期化
npm run setup

# 環境変数の設定
cp .env.example .env
# .env を編集して NATURE_API_TOKEN を設定

# 開発サーバー起動（フロント + バック 並列）
npm run dev
```

- フロントエンド
  - http://localhost:5173
- バックエンド API
  - フロントエンドからリバースプロキシでアクセス (`/api`)

### Docker での実行

```bash
# .env ファイルを設定後
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down
```

## 環境変数

### バックエンド

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `NATURE_API_TOKEN` | Nature API トークン（必須） | - |
| `SQLITE_PATH` | SQLite ファイルパス | `./data/database.sqlite` |
| `PORT` | サーバーポート | `3000` |
| `AUTH_ENABLED` | Auth0 認証の有効化 | `false` |
| `AUTH0_ISSUER_URL` | Auth0 発行者URL | - |
| `AUTH0_AUDIENCE` | Auth0 オーディエンス | - |

### フロントエンド

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `VITE_AUTH_ENABLED` | Auth0 認証の有効化 | `false` |
| `VITE_AUTH0_DOMAIN` | Auth0 ドメイン | - |
| `VITE_AUTH0_CLIENT_ID` | Auth0 クライアントID | - |
| `VITE_AUTH0_AUDIENCE` | Auth0 オーディエンス | - |

## npm スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run setup` | 初期セットアップ（install + DB初期化 + migrate） |
| `npm run dev` | 開発サーバー起動（フロント + バック） |
| `npm run build` | ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run db:migrate` | DBマイグレーション実行 |
| `npm run db:migrate:revert` | マイグレーションロールバック |

## API エンドポイント

| Method | Path | Description |
|--------|------|------|
| GET    | `/api/health` | ヘルスチェック |
| GET    | `/api/devices` | デバイス一覧 |
| GET    | `/api/appliances` | 家電一覧 |
| POST   | `/api/appliances/:id/action` | アクション実行 |
| GET    | `/api/schedules` | スケジュール一覧 |
| POST   | `/api/schedules` | スケジュール作成 |
| PUT    | `/api/schedules/:id` | スケジュール更新 |
| DELETE | `/api/schedules/:id` | スケジュール削除 |
| POST   | `/api/schedules/:id/toggle` | 有効/無効切り替え |
| GET    | `/api/logs` | 実行ログ一覧 |

## プロジェクト構造

```
remo-timer/
├── backend/                 # Express バックエンド
│   ├── src/
│   │   ├── entities/        # TypeORM エンティティ
│   │   ├── services/        # ビジネスロジック
│   │   ├── routes/          # API ルート
│   │   └── middleware/      # 認証ミドルウェア
│   └── Dockerfile
├── frontend/                # Vue フロントエンド
│   ├── src/
│   │   ├── views/           # ページコンポーネント
│   │   ├── components/      # 再利用コンポーネント
│   │   └── services/        # API クライアント
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/       # CI/CD
```

## ライセンス

MIT
