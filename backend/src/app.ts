import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import devicesRouter from './routes/devices';
import schedulesRouter from './routes/schedules';
import logsRouter from './routes/logs';
import authRouter from './routes/auth';
import { authMiddleware, checkAuth, handleAuthError, AUTH_ENABLED } from './middleware/auth';
import { csrfProtection, getCsrfToken, handleCsrfError, CSRF_ENABLED } from './middleware/csrf';

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

app.set('trust proxy', process.env.TRUST_PROXY ? 1 : 0); // Trust first proxy

// Health check endpoint - publicly accessible
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply Auth0 OIDC middleware for session management (only if auth is enabled)
// This must be applied before routes to handle /api/auth/login, /api/auth/logout, /api/auth/callback
app.use(authMiddleware);

// Auth routes (status endpoint) - publicly accessible
app.use('/api', authRouter);

// CSRF token endpoint - requires authentication
app.get('/api/csrf-token', checkAuth, getCsrfToken);

// Protected routes - require authentication and CSRF protection
app.use('/api', checkAuth, csrfProtection, devicesRouter);
app.use('/api', checkAuth, csrfProtection, schedulesRouter);
app.use('/api', checkAuth, csrfProtection, logsRouter);

// Error handlers
if (CSRF_ENABLED) {
  app.use(handleCsrfError);
}
if (AUTH_ENABLED) {
  app.use(handleAuthError);
}

export default app;
