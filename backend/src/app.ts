import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import devicesRouter from './routes/devices';
import schedulesRouter from './routes/schedules';
import logsRouter from './routes/logs';
import authRouter from './routes/auth';
import { authMiddleware, checkAuth, AUTH_ENABLED } from './middleware/auth';

// 認証状態を Context に保存するための型定義
export type AuthVariables = {
  isAuthenticated: boolean;
  user: {
    name?: string;
    email?: string;
    picture?: string;
  } | null;
};

const app = new Hono<{ Variables: AuthVariables }>();

// CORS
app.use('*', cors());

// Logger
app.use('*', logger());

// Health check endpoint - publicly accessible
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply Auth middleware for session management (only if auth is enabled)
app.use('/api/*', authMiddleware);

// Auth routes (status endpoint) - publicly accessible
app.route('/api', authRouter);

// Protected routes - require authentication
const protectedApi = new Hono<{ Variables: AuthVariables }>();
protectedApi.use('*', checkAuth);
protectedApi.route('/', devicesRouter);
protectedApi.route('/', schedulesRouter);
protectedApi.route('/', logsRouter);

app.route('/api', protectedApi);

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);

  // Handle auth errors
  if (AUTH_ENABLED && (err.message === 'Unauthorized' || err.message === 'Authentication required')) {
    return c.json({
      error: 'Unauthorized',
      message: err.message || 'Valid authentication required',
    }, 401);
  }

  return c.json({
    error: 'Internal Server Error',
    message: err.message,
  }, 500);
});

export default app;
