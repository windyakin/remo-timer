import express from 'express';
import cors from 'cors';
import devicesRouter from './routes/devices';
import schedulesRouter from './routes/schedules';
import logsRouter from './routes/logs';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', devicesRouter);
app.use('/api', schedulesRouter);
app.use('/api', logsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
