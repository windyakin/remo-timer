# Backend CLAUDE.md

このファイルは Claude Code がバックエンドディレクトリで作業する際のガイダンスを提供します。

## 技術スタック

- **フレームワーク**: Express + TypeScript
- **ORM**: TypeORM with better-sqlite3
- **スケジューラ**: node-cron（繰り返し）+ setTimeout（一度きり）
- **認証**: express-openid-connect (Auth0 OIDC, オプション)

## ディレクトリ構成

```
src/
├── config/           # 設定
│   ├── database.ts   # TypeORM DataSource 設定
│   └── sessionStore.ts # SQLite セッションストア
├── entities/         # TypeORM エンティティ
│   ├── Schedule.ts
│   ├── ExecutionLog.ts
│   └── ApplianceCache.ts
├── migrations/       # DB マイグレーション
├── services/         # ビジネスロジック
│   ├── NatureApiService.ts      # Nature API クライアント
│   ├── SchedulerService.ts      # スケジュール実行管理
│   └── ApplianceCacheService.ts # 家電情報キャッシュ
├── routes/           # API ルート
│   ├── devices.ts    # デバイス・家電エンドポイント
│   ├── schedules.ts  # スケジュール CRUD
│   ├── logs.ts       # 実行ログ
│   └── auth.ts       # 認証状態エンドポイント
├── middleware/       # ミドルウェア
│   └── auth.ts       # OIDC 認証ミドルウェア
├── types/            # 型定義
│   └── nature.ts     # Nature API レスポンス型
├── app.ts            # Express アプリケーション設定
└── index.ts          # エントリーポイント
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm run start

# マイグレーション実行
npm run migration:run

# マイグレーション取り消し
npm run migration:revert
```

## 環境変数

| 変数 | 説明 | 必須 | デフォルト |
|------|------|------|-----------|
| `NATURE_API_TOKEN` | Nature API トークン | Yes | - |
| `SQLITE_PATH` | SQLite ファイルパス | No | `./data/database.sqlite` |
| `PORT` | サーバーポート | No | `3000` |
| `NODE_ENV` | 実行環境 | No | `development` |
| `DB_LOGGING` | DB クエリログ | No | `false` |
| `TRUST_PROXY` | プロキシ信頼 | No | `false` |
| `AUTH_ENABLED` | 認証有効化 | No | `false` |
| `BASE_URL` | アプリ外部 URL | No | `http://localhost:5173` |
| `AUTH0_ISSUER_URL` | Auth0 発行者 URL | Auth時 | - |
| `AUTH0_CLIENT_ID` | Auth0 クライアント ID | Auth時 | - |
| `AUTH0_CLIENT_SECRET` | Auth0 クライアントシークレット | Auth時 | - |
| `SESSION_SECRET` | セッション暗号化キー | Auth時 | `development-secret-...` |

## コード規約

### TypeScript
- 厳格な型チェックを使用
- `any` の使用を避ける
- Nature API の型は `src/types/nature.ts` で定義

### API レスポンス
- 成功: 適切な HTTP ステータスと JSON レスポンス
- エラー: `{ error: string, message?: string }` 形式

### スケジュール実行
- **繰り返し**: node-cron で Cron 式に基づいてジョブを登録
- **一度きり**: setTimeout で指定時刻に実行、実行後スケジュールを自動削除

### セッション管理
- `SQLiteSessionStore` で OIDC セッションを永続化
- 期限切れセッションは毎日 0:00 に自動クリーンアップ
- 起動時に前回クリーンアップから 24 時間以上経過していれば即座に実行

## データベース

### エンティティ

- `Schedule`: スケジュール定義（家電ID、アクション、実行タイミング）
- `ExecutionLog`: 実行履歴（成功/失敗、エラーメッセージ）
- `ApplianceCache`: Nature API から取得した家電情報のキャッシュ

### マイグレーション管理
- 新しいマイグレーションは `src/migrations/` に作成
- `src/config/database.ts` の `migrations` 配列に追加
- 本番デプロイ時はビルド後に `npm run migration:run:js` を実行

## 注意事項

- Nature API のレート制限に注意（短時間での連続リクエストを避ける）
- セッションシークレットは本番環境で必ず変更する
- `TRUST_PROXY` はリバースプロキシ経由の場合に設定
