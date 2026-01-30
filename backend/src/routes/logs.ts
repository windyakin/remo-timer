import { Hono } from 'hono';
import { AppDataSource } from '../config/database';
import { ExecutionLog } from '../entities/ExecutionLog';

const router = new Hono();

router.get('/logs', async (c) => {
  try {
    const logRepository = AppDataSource.getRepository(ExecutionLog);
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const [logs, total] = await logRepository.findAndCount({
      relations: ['schedule'],
      order: { executedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return c.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

router.get('/logs/schedule/:scheduleId', async (c) => {
  try {
    const logRepository = AppDataSource.getRepository(ExecutionLog);
    const scheduleId = parseInt(c.req.param('scheduleId'));
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const [logs, total] = await logRepository.findAndCount({
      where: { scheduleId },
      order: { executedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return c.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('Failed to fetch logs for schedule:', error);
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

export default router;
