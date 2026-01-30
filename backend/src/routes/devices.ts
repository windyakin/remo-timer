import { Hono } from 'hono';
import { natureApiService } from '../services/NatureApiService';
import { applianceCacheService } from '../services/ApplianceCacheService';
import { ApplianceAction } from '../types/nature';

const router = new Hono();

router.get('/devices', async (c) => {
  try {
    const devices = await natureApiService.getDevices();
    return c.json(devices);
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch devices',
    }, 500);
  }
});

router.get('/appliances', async (c) => {
  try {
    // refresh=true クエリパラメータで強制更新
    const forceRefresh = c.req.query('refresh') === 'true';
    const appliances = await applianceCacheService.getAppliances(forceRefresh);
    return c.json(appliances);
  } catch (error) {
    console.error('Failed to fetch appliances:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch appliances',
    }, 500);
  }
});

// デバイスにアクションを送信
router.post('/appliances/:id/action', async (c) => {
  try {
    const id = c.req.param('id');
    const action = await c.req.json<ApplianceAction>();

    if (!action || !action.type) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    await natureApiService.executeAction(id, action);

    // アクション実行後、キャッシュを無効化（次回取得時に更新される）
    await applianceCacheService.invalidateCache();

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to execute action:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to execute action',
    }, 500);
  }
});

export default router;
