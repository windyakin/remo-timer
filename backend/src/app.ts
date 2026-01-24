import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import devicesRouter from './routes/devices';
import schedulesRouter from './routes/schedules';
import logsRouter from './routes/logs';
import { checkJwt, handleAuthError, AUTH_ENABLED } from './middleware/auth';

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint - publicly accessible
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply JWT validation to all /api routes (only if auth is enabled)
if (AUTH_ENABLED) {
  app.use('/api', checkJwt);
}

// Routes
app.use('/api', devicesRouter);
app.use('/api', schedulesRouter);
app.use('/api', logsRouter);

// Auth error handler (only if auth is enabled)
if (AUTH_ENABLED) {
  app.use(handleAuthError);
}

export default app;
