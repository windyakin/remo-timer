import { Hono } from 'hono';
import { AUTH_ENABLED, getLoginUrl, getLogoutUrl, handleCallback, handleLogout } from '../middleware/auth';
import type { AuthVariables } from '../app';

const router = new Hono<{ Variables: AuthVariables }>();

interface AuthStatusResponse {
  authEnabled: boolean;
  isAuthenticated: boolean;
  user: {
    name?: string;
    email?: string;
    picture?: string;
  } | null;
}

// 認証状態を返すエンドポイント
router.get('/auth/status', (c) => {
  if (!AUTH_ENABLED) {
    const response: AuthStatusResponse = {
      authEnabled: false,
      isAuthenticated: false,
      user: null,
    };
    return c.json(response);
  }

  const response: AuthStatusResponse = {
    authEnabled: true,
    isAuthenticated: c.get('isAuthenticated') ?? false,
    user: c.get('user') ?? null,
  };

  return c.json(response);
});

// ログインエンドポイント - Auth0 にリダイレクト
router.get('/auth/login', async (c) => {
  if (!AUTH_ENABLED) {
    return c.json({ error: 'Authentication is not enabled' }, 400);
  }

  try {
    const loginUrl = await getLoginUrl(c);
    return c.redirect(loginUrl);
  } catch (error) {
    console.error('Failed to generate login URL:', error);
    return c.json({ error: 'Failed to initiate login' }, 500);
  }
});

// ログアウトエンドポイント
router.get('/auth/logout', (c) => {
  if (!AUTH_ENABLED) {
    return c.json({ error: 'Authentication is not enabled' }, 400);
  }

  handleLogout(c);
  const logoutUrl = getLogoutUrl();
  return c.redirect(logoutUrl);
});

// OAuth コールバックエンドポイント
router.get('/auth/callback', async (c) => {
  if (!AUTH_ENABLED) {
    return c.json({ error: 'Authentication is not enabled' }, 400);
  }

  const result = await handleCallback(c);

  if (result.success) {
    // 認証成功 - ホームページにリダイレクト
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    return c.redirect(baseUrl);
  } else {
    // 認証失敗
    return c.json({ error: 'Authentication failed', message: result.error }, 401);
  }
});

export default router;
