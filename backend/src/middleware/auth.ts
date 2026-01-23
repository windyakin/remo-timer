import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';

// Auth0 認証の有効/無効を環境変数で制御
export const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';

if (AUTH_ENABLED) {
  console.log('Auth0 config:', {
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_URL,
  });
}

// JWT validation middleware (認証無効時は何もしないミドルウェア)
export const checkJwt = AUTH_ENABLED
  ? auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: process.env.AUTH0_ISSUER_URL,
      tokenSigningAlg: 'RS256',
    })
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
