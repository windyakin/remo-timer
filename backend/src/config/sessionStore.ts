import Database from 'better-sqlite3';
import cron from 'node-cron';
import path from 'path';
import type { SessionStore } from 'express-openid-connect';

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/database.sqlite');

// express-openid-connect 互換のセッションストア
// 必要なメソッド: get, set, destroy
export class SQLiteSessionStore implements SessionStore {
  private db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
  }

  get: SessionStore['get'] = (sid, callback) => {
    try {
      const row = this.db
        .prepare("SELECT sess FROM sessions WHERE sid = ? AND expired > datetime('now')")
        .get(sid) as { sess: string } | undefined;

      if (row) {
        const session = JSON.parse(row.sess);
        callback(null, session);
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(err);
    }
  };

  set: SessionStore['set'] = (sid, session, callback) => {
    try {
      const sess = JSON.stringify(session);
      // セッションの有効期限を計算（デフォルト1週間）
      const maxAge = session?.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expired = new Date(Date.now() + maxAge).toISOString();

      this.db
        .prepare(
          `INSERT INTO sessions (sid, sess, expired) VALUES (?, ?, ?)
           ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expired = excluded.expired`
        )
        .run(sid, sess, expired);

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  };

  destroy: SessionStore['destroy'] = (sid, callback) => {
    try {
      this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  };

  // 期限切れセッションを削除
  cleanup(): number {
    const result = this.db
      .prepare("DELETE FROM sessions WHERE expired <= datetime('now')")
      .run();
    return result.changes;
  }
}

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24時間
const METADATA_KEY = 'last_session_cleanup';

// メタデータの取得
function getMetadata(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM app_metadata WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

// メタデータの保存
function setMetadata(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, value);
}

// シングルトンインスタンス
export const sessionStore = new SQLiteSessionStore();

// クリーンアップを実行し、実行時刻を記録
function runCleanup(db: Database.Database): void {
  const deleted = sessionStore.cleanup();
  setMetadata(db, METADATA_KEY, new Date().toISOString());
  console.log(`[SessionStore] Cleaned up ${deleted} expired sessions`);
}

// 期限切れセッションのクリーンアップジョブを開始
export function startSessionCleanupJob(): void {
  const db = new Database(dbPath);

  // 起動時: 最後の実行が24時間以上前なら即座に実行
  const lastCleanup = getMetadata(db, METADATA_KEY);
  if (lastCleanup) {
    const lastTime = new Date(lastCleanup).getTime();
    const elapsed = Date.now() - lastTime;
    if (elapsed >= CLEANUP_INTERVAL_MS) {
      console.log('[SessionStore] Last cleanup was over 24 hours ago, running now...');
      runCleanup(db);
    } else {
      const hoursAgo = Math.floor(elapsed / (60 * 60 * 1000));
      console.log(`[SessionStore] Last cleanup was ${hoursAgo} hours ago, skipping startup cleanup`);
    }
  } else {
    console.log('[SessionStore] No previous cleanup record, running initial cleanup...');
    runCleanup(db);
  }

  // 毎日0時に定期実行
  cron.schedule('0 0 * * *', () => {
    runCleanup(db);
  });
  console.log('[SessionStore] Session cleanup job scheduled (daily at 00:00)');
}
