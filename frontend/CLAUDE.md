# Frontend CLAUDE.md

このファイルは Claude Code がフロントエンドディレクトリで作業する際のガイダンスを提供します。

## 技術スタック

- **フレームワーク**: Vue 3 (Composition API) + TypeScript
- **ビルド**: Vite
- **UI ライブラリ**: PrimeVue 4 (Aura テーマ)
- **CSS**: PrimeFlex 4
- **ルーティング**: Vue Router 4
- **認証**: BFF パターン（バックエンド経由）

## ディレクトリ構成

```
src/
├── views/            # ページコンポーネント
│   ├── ScheduleList.vue    # スケジュール一覧
│   ├── ScheduleForm.vue    # スケジュール作成・編集
│   ├── DeviceList.vue      # デバイス・家電一覧
│   └── ExecutionLogs.vue   # 実行ログ
├── components/       # 再利用可能コンポーネント
│   ├── AppHeader.vue       # ヘッダー
│   ├── BottomNavigation.vue # モバイル用ボトムナビ
│   ├── ScheduleCard.vue    # スケジュールカード
│   ├── AirconActionForm.vue # エアコン操作フォーム
│   └── ButtonActionForm.vue # ボタン操作フォーム
├── composables/      # Vue Composables
│   └── useAuth.ts          # 認証状態管理
├── services/         # API クライアント
│   └── api.ts              # fetch ベースの API クライアント
├── types/            # 型定義
│   └── index.ts            # フロントエンド用型定義
├── router/           # ルーティング設定
│   └── index.ts
├── App.vue           # ルートコンポーネント
└── main.ts           # エントリーポイント
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド（型チェック + Vite ビルド）
npm run build

# プレビュー
npm run preview
```

## 環境変数

BFF パターンを採用しているため、**フロントエンドに認証関連の環境変数は不要**です。

認証はすべてバックエンド経由で行われ、フロントエンドは以下のエンドポイントにリダイレクトするだけです：
- ログイン: `/api/auth/login`
- ログアウト: `/api/auth/logout`

## コード規約

### Vue コンポーネント
- Composition API (`<script setup>`) を使用
- TypeScript で型を明示的に定義
- `defineProps` / `defineEmits` で props と events を型付け

### PrimeVue
- コンポーネントは `main.ts` でグローバル登録済み
- Aura テーマを使用（ダークモード非対応）
- PrimeFlex でユーティリティクラスを使用

### API 通信
- `src/services/api.ts` の関数を使用
- fetch API ベース、credentials: 'include' でセッションクッキーを送信
- エラーハンドリングは呼び出し側で行う

### 認証
- `useAuth()` composable で認証状態を管理
- `isLoading`: 認証状態取得中
- `authEnabled`: 認証が有効か
- `isAuthenticated`: ログイン済みか
- `user`: ユーザー情報（name, email, picture）

## レイアウト

### レスポンシブ対応
- モバイル: ボトムナビゲーション表示
- デスクトップ: ヘッダーナビゲーションのみ
- ブレークポイント: `768px` (PrimeFlex の `md`)

### Toast 位置
- モバイル: `top-center`
- デスクトップ: `bottom-center`

## API エンドポイント

フロントエンドから呼び出す主要なエンドポイント：

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/auth/status` | 認証状態確認 |
| GET | `/api/appliances` | 家電一覧取得 |
| POST | `/api/appliances/:id/action` | 家電アクション実行 |
| GET | `/api/schedules` | スケジュール一覧 |
| POST | `/api/schedules` | スケジュール作成 |
| PUT | `/api/schedules/:id` | スケジュール更新 |
| DELETE | `/api/schedules/:id` | スケジュール削除 |
| POST | `/api/schedules/:id/toggle` | 有効/無効切り替え |
| GET | `/api/logs` | 実行ログ一覧 |

## 注意事項

- PrimeVue 4 は PrimeVue 3 と API が異なる（特に theming）
- 開発時は Vite の proxy で `/api` をバックエンドに転送
- PWA 対応のため `vite-plugin-pwa` を使用
