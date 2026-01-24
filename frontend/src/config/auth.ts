// Auth0 認証の有効/無効を環境変数で制御
export const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
};
