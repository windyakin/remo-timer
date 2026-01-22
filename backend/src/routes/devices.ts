import { Router, Request, Response } from 'express';
import { natureApiService } from '../services/NatureApiService';
import { applianceCacheService } from '../services/ApplianceCacheService';
import { ApplianceAction } from '../types/nature';

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

router.get('/appliances', async (req: Request, res: Response) => {
  try {
    // refresh=true クエリパラメータで強制更新
    const forceRefresh = req.query.refresh === 'true';
    const appliances = await applianceCacheService.getAppliances(forceRefresh);
    res.json(appliances);
  } catch (error) {
    console.error('Failed to fetch appliances:', error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to fetch appliances',
    });
  }
});

// デバイスにアクションを送信
router.post(
  '/appliances/:id/action',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const action = req.body as ApplianceAction;

      if (!action || !action.type) {
        res.status(400).json({ error: 'Invalid action' });
        return;
      }

      await natureApiService.executeAction(id, action);

      // アクション実行後、キャッシュを無効化（次回取得時に更新される）
      await applianceCacheService.invalidateCache();

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to execute action:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to execute action',
      });
    }
  }
);

export default router;
