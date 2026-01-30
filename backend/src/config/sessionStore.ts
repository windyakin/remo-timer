import Database from 'better-sqlite3';
import path from 'path';
import type { SessionStore } from 'express-openid-connect';

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/database.sqlite');

// express-openid-connect 互換のセッションストア
// 必要なメソッド: get, set, destroy
export class SQLiteSessionStore implements SessionStore {
  private db: Database.Database;

  constructor() {
    console.log('[SessionStore] Initializing with dbPath:', dbPath);
    this.db = new Database(dbPath);
  }

  get: SessionStore['get'] = (sid, callback) => {
    console.log('[SessionStore] get:', sid);
    try {
      const row = this.db
        .prepare("SELECT sess FROM sessions WHERE sid = ? AND expired > datetime('now')")
        .get(sid) as { sess: string } | undefined;

      console.log('[SessionStore] get result:', row ? 'found' : 'not found');
      if (row) {
        const session = JSON.parse(row.sess);
        callback(null, session);
      } else {
        callback(null, null);
      }
    } catch (err) {
      console.error('[SessionStore] get error:', err);
      callback(err);
    }
  };

  set: SessionStore['set'] = (sid, session, callback) => {
    console.log('[SessionStore] set:', sid);
    try {
      const sess = JSON.stringify(session);
      // セッションの有効期限を計算（デフォルト24時間）
      const maxAge = session?.cookie?.maxAge || 24 * 60 * 60 * 1000;
      const expired = new Date(Date.now() + maxAge).toISOString();

      this.db
        .prepare(
          `INSERT INTO sessions (sid, sess, expired) VALUES (?, ?, ?)
           ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expired = excluded.expired`
        )
        .run(sid, sess, expired);

      console.log('[SessionStore] set success');
      callback?.();
    } catch (err) {
      console.error('[SessionStore] set error:', err);
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
}
