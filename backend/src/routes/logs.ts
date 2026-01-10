import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ExecutionLog } from '../entities/ExecutionLog';

const router = Router();

router.get('/logs', async (req: Request, res: Response) => {
  try {
    const logRepository = AppDataSource.getRepository(ExecutionLog);
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const [logs, total] = await logRepository.findAndCount({
      relations: ['schedule'],
      order: { executedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    res.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/logs/schedule/:scheduleId', async (req: Request, res: Response) => {
  try {
    const logRepository = AppDataSource.getRepository(ExecutionLog);
    const scheduleId = parseInt(req.params.scheduleId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const [logs, total] = await logRepository.findAndCount({
      where: { scheduleId },
      order: { executedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    res.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('Failed to fetch logs for schedule:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
