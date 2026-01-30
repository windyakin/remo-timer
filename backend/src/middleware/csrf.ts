import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AUTH_ENABLED } from './auth';

// CSRF保護は認証が有効な場合のみ適用
const CSRF_ENABLED = AUTH_ENABLED;

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'development-secret-please-change',
  getSessionIdentifier: (req) => {
    // express-openid-connectのセッションCookieを識別子として使用
    // appSessionはデフォルトのCookie名
    return req.cookies?.appSession || '';
  },
  // 開発環境ではHTTPなので__Host-プレフィックスは使えない（Secure属性が必須のため）
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-csrf' : 'csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => {
    // ヘッダーからトークンを取得
    return req.headers['x-csrf-token'] as string;
  },
});

// CSRF保護ミドルウェア（認証無効時は何もしない）
export const csrfProtection: RequestHandler = CSRF_ENABLED
  ? doubleCsrfProtection
  : (_req: Request, _res: Response, next: NextFunction) => next();

// CSRFトークンを取得するハンドラー
export const getCsrfToken = (req: Request, res: Response) => {
  if (!CSRF_ENABLED) {
    return res.json({ csrfToken: '' });
  }

  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
};

// CSRFエラーハンドラー
export const handleCsrfError = (
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token',
    });
  }
  next(err);
};

export { CSRF_ENABLED };
