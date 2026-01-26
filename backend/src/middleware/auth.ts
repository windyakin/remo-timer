import { auth, requiresAuth, ConfigParams } from 'express-openid-connect';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Auth0 認証の有効/無効を環境変数で制御
export const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';

// express-openid-connect の設定
export const authConfig: ConfigParams = {
  authRequired: false, // 全ルートに認証を要求しない（個別に requiresAuth() で制御）
  auth0Logout: true, // Auth0 のログアウト URL を使用
  baseURL: process.env.BASE_URL || 'http://localhost:5173',
  clientID: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  issuerBaseURL: process.env.AUTH0_ISSUER_URL || '',
  secret: process.env.SESSION_SECRET || 'development-secret-please-change',
  routes: {
    // /api プレフィックスを付けた認証ルート
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
  },
  session: {
    absoluteDuration: 24 * 60 * 60, // 24時間
    rolling: true, // アクティビティがあればセッション延長
    rollingDuration: 60 * 60, // 1時間ごとにリフレッシュ
  },
};

if (AUTH_ENABLED) {
  console.log('Auth0 BFF config:', {
    baseURL: authConfig.baseURL,
    issuerBaseURL: authConfig.issuerBaseURL,
    clientID: authConfig.clientID ? '***' : '(not set)',
    routes: authConfig.routes,
  });
}

// Auth0 OIDC ミドルウェア（認証無効時は何もしないミドルウェア）
export const authMiddleware: RequestHandler = AUTH_ENABLED
  ? auth(authConfig)
  : (_req: Request, _res: Response, next: NextFunction) => next();

// 認証を要求するミドルウェア（認証無効時は何もしないミドルウェア）
export const checkAuth: RequestHandler = AUTH_ENABLED
  ? requiresAuth()
  : (_req: Request, _res: Response, next: NextFunction) => next();

// Error handling middleware for auth errors
export const handleAuthError = (
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Auth error:', err.message, err.code, err.status);
  if (err.status === 401 || err.code === 'invalid_token') {
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message || 'Valid authentication required',
    });
    return;
  }
  next(err);
};
