import { Router, Request, Response } from 'express';
import { natureApiService } from '../services/NatureApiService';

const router = Router();

router.get('/devices', async (_req: Request, res: Response) => {
  try {
    const devices = await natureApiService.getDevices();
    res.json(devices);
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch devices',
    });
  }
});

router.get('/appliances', async (_req: Request, res: Response) => {
  try {
    const appliances = await natureApiService.getAppliances();
    res.json(appliances);
  } catch (error) {
    console.error('Failed to fetch appliances:', error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to fetch appliances',
    });
  }
});

export default router;
