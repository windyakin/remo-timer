import { AppDataSource } from '../config/database';
import { ApplianceCache } from '../entities/ApplianceCache';
import { NatureAppliance } from '../types/nature';
import { natureApiService } from './NatureApiService';

// キャッシュの有効期限（秒）- デフォルト5分
const CACHE_TTL_SECONDS = parseInt(process.env.APPLIANCE_CACHE_TTL || '300', 10);

export class ApplianceCacheService {
  private repository = AppDataSource.getRepository(ApplianceCache);

  /**
   * キャッシュされたアプライアンス一覧を取得
   * キャッシュが無効な場合はAPIから取得して更新
   */
  async getAppliances(forceRefresh = false): Promise<NatureAppliance[]> {
    if (!forceRefresh) {
      const cached = await this.getCachedAppliances();
      if (cached.length > 0) {
        return cached;
      }
    }

    // APIから取得してキャッシュを更新
    return this.refreshCache();
  }

  /**
   * キャッシュを強制的に更新
   */
  async refreshCache(): Promise<NatureAppliance[]> {
    const appliances = await natureApiService.getAppliances();
    await this.updateCache(appliances);
    return appliances;
  }

  /**
   * キャッシュからアプライアンス一覧を取得
   * 有効期限切れの場合は空配列を返す
   */
  private async getCachedAppliances(): Promise<NatureAppliance[]> {
    const cached = await this.repository.find();

    if (cached.length === 0) {
      return [];
    }

    // 最も古いキャッシュの更新日時をチェック
    const oldestUpdate = Math.min(...cached.map((c) => c.updatedAt.getTime()));
    const now = Date.now();
    const cacheAge = (now - oldestUpdate) / 1000;

    if (cacheAge > CACHE_TTL_SECONDS) {
      console.log(`Cache expired (age: ${cacheAge.toFixed(0)}s > TTL: ${CACHE_TTL_SECONDS}s)`);
      return [];
    }

    console.log(`Using cached appliances (age: ${cacheAge.toFixed(0)}s)`);
    return cached.map((c) => c.data);
  }

  /**
   * キャッシュを更新
   */
  private async updateCache(appliances: NatureAppliance[]): Promise<void> {
    // 既存のキャッシュを全削除
    await this.repository.clear();

    // 新しいデータを挿入
    const cacheEntries = appliances.map((appliance) => {
      const cache = new ApplianceCache();
      cache.id = appliance.id;
      cache.data = appliance;
      return cache;
    });

    await this.repository.save(cacheEntries);
    console.log(`Cached ${appliances.length} appliances`);
  }

  /**
   * 特定のアプライアンスのキャッシュを無効化
   */
  async invalidateCache(applianceId?: string): Promise<void> {
    if (applianceId) {
      await this.repository.delete(applianceId);
    } else {
      await this.repository.clear();
    }
  }
}

// シングルトンインスタンス
let _applianceCacheService: ApplianceCacheService | null = null;

export function getApplianceCacheService(): ApplianceCacheService {
  if (!_applianceCacheService) {
    _applianceCacheService = new ApplianceCacheService();
  }
  return _applianceCacheService;
}

export const applianceCacheService = {
  getAppliances: (forceRefresh = false) =>
    getApplianceCacheService().getAppliances(forceRefresh),
  refreshCache: () => getApplianceCacheService().refreshCache(),
  invalidateCache: (applianceId?: string) =>
    getApplianceCacheService().invalidateCache(applianceId),
};
