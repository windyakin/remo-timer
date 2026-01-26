import { Router, Request, Response } from 'express';

const router = Router();

// AUTH_ENABLED は app.ts から渡される
export const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';

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
router.get('/auth/status', (req: Request, res: Response) => {
  if (!AUTH_ENABLED) {
    const response: AuthStatusResponse = {
      authEnabled: false,
      isAuthenticated: false,
      user: null,
    };
    res.json(response);
    return;
  }

  // express-openid-connect が req.oidc を設定する
  const oidc = (req as Request & { oidc?: { isAuthenticated: () => boolean; user?: Record<string, unknown> } }).oidc;

  const response: AuthStatusResponse = {
    authEnabled: true,
    isAuthenticated: oidc?.isAuthenticated() ?? false,
    user: oidc?.user
      ? {
          name: oidc.user.name as string | undefined,
          email: oidc.user.email as string | undefined,
          picture: oidc.user.picture as string | undefined,
        }
      : null,
  };

  res.json(response);
});

export default router;
