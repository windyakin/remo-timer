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

// シングルトンインスタンス
export const sessionStore = new SQLiteSessionStore();

// 期限切れセッションのクリーンアップジョブを開始（毎日0時に実行）
export function startSessionCleanupJob(): void {
  cron.schedule('0 0 * * *', () => {
    const deleted = sessionStore.cleanup();
    console.log(`[SessionStore] Cleaned up ${deleted} expired sessions`);
  });
  console.log('[SessionStore] Session cleanup job scheduled (daily at 00:00)');
}
