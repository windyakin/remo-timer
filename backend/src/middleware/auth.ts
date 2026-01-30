import { Context, Next, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import * as client from 'openid-client';
import { sessionStore } from '../config/sessionStore';
import type { AuthVariables } from '../app';

// Auth0 認証の有効/無効を環境変数で制御
export const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';

// セッションデータの型定義
interface SessionData {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    name?: string;
    email?: string;
    picture?: string;
    sub?: string;
  };
  cookie?: {
    maxAge?: number;
  };
}

// OIDC クライアント設定（遅延初期化）
let oidcConfig: client.Configuration | null = null;

async function getOidcConfig(): Promise<client.Configuration> {
  if (oidcConfig) {
    return oidcConfig;
  }

  const issuerUrl = process.env.AUTH0_ISSUER_URL;
  if (!issuerUrl) {
    throw new Error('AUTH0_ISSUER_URL is not configured');
  }

  oidcConfig = await client.discovery(
    new URL(issuerUrl),
    process.env.AUTH0_CLIENT_ID || '',
    process.env.AUTH0_CLIENT_SECRET || ''
  );

  return oidcConfig;
}

// ベースURLの取得
function getBaseUrl(): string {
  return process.env.BASE_URL || 'http://localhost:5173';
}

// セッションIDをCookieから取得、または新規生成
function getSessionId(c: Context): string {
  const sid = getCookie(c, 'sid');
  if (sid) {
    return sid;
  }
  // 新しいセッションIDを生成
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// セッションを保存
function saveSession(c: Context, sid: string, data: SessionData): void {
  setCookie(c, 'sid', sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60, // 1週間
    path: '/',
  });
  sessionStore.set(sid, { ...data, cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } }, () => {});
}

// セッションを取得
async function getSession(sid: string): Promise<SessionData | null> {
  return new Promise((resolve) => {
    sessionStore.get(sid, (err: unknown, session: unknown) => {
      if (err || !session) {
        resolve(null);
      } else {
        resolve(session as SessionData);
      }
    });
  });
}

// セッションを削除
function destroySession(c: Context, sid: string): void {
  deleteCookie(c, 'sid');
  sessionStore.destroy(sid, () => {});
}

// Auth0 ログイン URL を生成
export async function getLoginUrl(c: Context): Promise<string> {
  const config = await getOidcConfig();
  const baseUrl = getBaseUrl();
  const redirectUri = `${baseUrl}/api/auth/callback`;

  // state をセッションに保存
  const state = Math.random().toString(36).substring(2, 15);
  const sid = getSessionId(c);
  saveSession(c, sid, { cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } });

  const authUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    state,
  });

  // state をセッションに保存
  const session = await getSession(sid) || {};
  saveSession(c, sid, { ...session, state } as SessionData & { state: string });

  return authUrl.href;
}

// Auth0 ログアウト URL を生成
export function getLogoutUrl(): string {
  const issuerUrl = process.env.AUTH0_ISSUER_URL || '';
  const baseUrl = getBaseUrl();
  const clientId = process.env.AUTH0_CLIENT_ID || '';

  // Auth0 のログアウトエンドポイント
  const logoutUrl = new URL(`${issuerUrl}/v2/logout`);
  logoutUrl.searchParams.set('client_id', clientId);
  logoutUrl.searchParams.set('returnTo', baseUrl);

  return logoutUrl.href;
}

// コールバック処理
export async function handleCallback(c: Context): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getOidcConfig();
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/auth/callback`;

    const url = new URL(c.req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return { success: false, error: 'No authorization code received' };
    }

    // トークンを取得
    const tokens = await client.authorizationCodeGrant(config, url, {
      expectedState: client.skipStateCheck,
    });

    // ユーザー情報を取得
    const claims = tokens.claims();

    // セッションに保存
    const sid = getSessionId(c);
    const sessionData: SessionData = {
      id_token: tokens.id_token,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        name: claims?.name as string | undefined,
        email: claims?.email as string | undefined,
        picture: claims?.picture as string | undefined,
        sub: claims?.sub as string | undefined,
      },
    };

    saveSession(c, sid, sessionData);

    return { success: true };
  } catch (error) {
    console.error('Auth callback error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Callback failed' };
  }
}

// 認証ミドルウェア（セッション確認・復元）
export const authMiddleware: MiddlewareHandler<{ Variables: AuthVariables }> = async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
  if (!AUTH_ENABLED) {
    c.set('isAuthenticated', false);
    c.set('user', null);
    return next();
  }

  const sid = getCookie(c, 'sid');
  if (!sid) {
    c.set('isAuthenticated', false);
    c.set('user', null);
    return next();
  }

  const session = await getSession(sid);
  if (session?.user) {
    c.set('isAuthenticated', true);
    c.set('user', {
      name: session.user.name,
      email: session.user.email,
      picture: session.user.picture,
    });
  } else {
    c.set('isAuthenticated', false);
    c.set('user', null);
  }

  return next();
};

// 認証を要求するミドルウェア
export const checkAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
  if (!AUTH_ENABLED) {
    return next();
  }

  const isAuthenticated = c.get('isAuthenticated');
  if (!isAuthenticated) {
    return c.json({
      error: 'Unauthorized',
      message: 'Authentication required',
    }, 401);
  }

  return next();
};

// ログアウト処理
export function handleLogout(c: Context): void {
  const sid = getCookie(c, 'sid');
  if (sid) {
    destroySession(c, sid);
  }
}
