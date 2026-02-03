<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import { api } from '@/services/api';
import type { NatureAppliance, NatureDevice, ApplianceAction } from '@/types';
import {
  getApplianceTypeLabel,
  getApplianceTypeSeverity,
  getApplianceTypeIcon,
  getAirconModeLabel,
} from '@/utils/labels';

const toast = useToast();

const appliances = ref<NatureAppliance[]>([]);
const loading = ref(true);
const togglingIds = ref<Set<string>>(new Set());

const loadAppliances = async (showLoading = true, forceRefresh = false) => {
  if (showLoading) {
    loading.value = true;
  }
  try {
    appliances.value = await api.getAppliances(forceRefresh);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: 'デバイス一覧の取得に失敗しました',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// リフレッシュボタン押下時は強制更新
const refreshAppliances = () => loadAppliances(true, true);

const formatAirconSettings = (appliance: NatureAppliance): string => {
  if (appliance.type !== 'AC' || !appliance.settings) return '-';
  const { mode, temp, vol } = appliance.settings;
  return `${getAirconModeLabel(mode)} ${temp}° 風量:${vol}`;
};

const getCurrentState = (appliance: NatureAppliance): string => {
  if (appliance.type === 'AC') {
    return formatAirconSettings(appliance);
  }
  if (appliance.type === 'LIGHT' && appliance.light) {
    return appliance.light.state.power === 'on' ? '点灯' : '消灯';
  }
  return '-';
};

// デバイスの電源状態を取得（null = 不明）
const getPowerState = (appliance: NatureAppliance): boolean | null => {
  if (appliance.type === 'AC' && appliance.settings) {
    return appliance.settings.button !== 'power-off';
  }
  if (appliance.type === 'LIGHT' && appliance.light) {
    return appliance.light.state.power === 'on';
  }
  return null;
};

// 電源をトグル
const togglePower = async (appliance: NatureAppliance) => {
  const currentState = getPowerState(appliance);
  if (currentState === null) return;

  togglingIds.value.add(appliance.id);

  try {
    let action: ApplianceAction;

    if (appliance.type === 'AC') {
      if (currentState) {
        // ONからOFFへ
        action = { type: 'AC', button: 'power-off' };
      } else {
        // OFFからONへ（前回の設定で起動）
        action = {
          type: 'AC',
          operation_mode: appliance.settings?.mode,
          temperature: appliance.settings?.temp,
          air_volume: appliance.settings?.vol,
          air_direction: appliance.settings?.dir,
        };
      }
    } else if (appliance.type === 'LIGHT') {
      action = { type: 'LIGHT', button: currentState ? 'off' : 'on' };
    } else {
      return;
    }

    await api.sendApplianceAction(appliance.id, action);

    toast.add({
      severity: 'success',
      summary: '操作完了',
      detail: `${appliance.nickname}を${currentState ? 'OFF' : 'ON'}にしました`,
      life: 2000,
    });

    // 状態を更新するためにサイレントリロード
    await loadAppliances(false);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '操作に失敗しました',
      life: 3000,
    });
  } finally {
    togglingIds.value.delete(appliance.id);
  }
};

// アプライアンスからユニークなデバイスを抽出
const uniqueDevices = computed(() => {
  const deviceMap = new Map<string, NatureDevice>();
  for (const appliance of appliances.value) {
    if (appliance.device && !deviceMap.has(appliance.device.id)) {
      deviceMap.set(appliance.device.id, appliance.device);
    }
  }
  return Array.from(deviceMap.values());
});

// センサーデータのあるデバイスのみ表示
const devicesWithSensors = computed(() => {
  return uniqueDevices.value.filter((device) => {
    const events = device.newest_events;
    return events && (events.te || events.hu || events.il || events.mo);
  });
});

// タイムスタンプを相対時間でフォーマット
const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  return `${diffDays}日前`;
};

onMounted(loadAppliances);
</script>

<template>
  <div class="device-list">
    <!-- センサーデータ表示 -->
    <Card v-if="!loading && devicesWithSensors.length > 0" class="mb-3">
      <template #title>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-chart-line"></i>
          <span>センサー情報</span>
        </div>
      </template>
      <template #content>
        <div class="grid">
          <div
            v-for="device in devicesWithSensors"
            :key="device.id"
            class="col-12 md:col-6 lg:col-4"
          >
            <div class="surface-card border-round p-3 shadow-1 h-full">
              <div class="flex align-items-center gap-2 mb-3">
                <i class="pi pi-wifi text-primary"></i>
                <span class="font-semibold">{{ device.name }}</span>
              </div>
              <div class="flex flex-wrap gap-3">
                <!-- 温度 -->
                <div v-if="device.newest_events?.te" class="sensor-item">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-sun text-orange-500"></i>
                    <span class="text-2xl font-bold">{{ device.newest_events.te.val.toFixed(1) }}</span>
                    <span class="text-color-secondary">&deg;C</span>
                  </div>
                  <div class="text-xs text-color-secondary mt-1">
                    {{ formatRelativeTime(device.newest_events.te.created_at) }}
                  </div>
                </div>
                <!-- 湿度 -->
                <div v-if="device.newest_events?.hu" class="sensor-item">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-cloud text-blue-500"></i>
                    <span class="text-2xl font-bold">{{ device.newest_events.hu.val }}</span>
                    <span class="text-color-secondary">%</span>
                  </div>
                  <div class="text-xs text-color-secondary mt-1">
                    {{ formatRelativeTime(device.newest_events.hu.created_at) }}
                  </div>
                </div>
                <!-- 照度 -->
                <div v-if="device.newest_events?.il" class="sensor-item">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-bolt text-yellow-500"></i>
                    <span class="text-2xl font-bold">{{ device.newest_events.il.val.toFixed(0) }}</span>
                    <span class="text-color-secondary">lx</span>
                  </div>
                  <div class="text-xs text-color-secondary mt-1">
                    {{ formatRelativeTime(device.newest_events.il.created_at) }}
                  </div>
                </div>
                <!-- 人感センサー -->
                <div v-if="device.newest_events?.mo" class="sensor-item">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-user text-green-500"></i>
                    <span class="text-sm">最終検知</span>
                  </div>
                  <div class="text-xs text-color-secondary mt-1">
                    {{ formatRelativeTime(device.newest_events.mo.created_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        <div class="flex align-items-center justify-content-between">
          <span>デバイス一覧</span>
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            variant="outlined"
            rounded
            @click="refreshAppliances"
            :loading="loading"
          />
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="text-center py-4">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>
        <div v-else-if="appliances.length === 0" class="text-center py-4 text-color-secondary">
          デバイスがありません
        </div>
        <div v-else class="grid mt-2">
          <div
            v-for="appliance in appliances"
            :key="appliance.id"
            class="col-12 md:col-6 lg:col-4"
          >
            <div class="surface-card border-round p-3 shadow-1 h-full">
              <div class="flex align-items-center justify-content-between mb-3">
                <div class="flex align-items-center gap-2">
                <Tag
                  :value="getApplianceTypeLabel(appliance.type)"
                  :severity="getApplianceTypeSeverity(appliance.type)"
                  :icon="getApplianceTypeIcon(appliance.type)"
                />
                  <span class="font-semibold text-lg">{{ appliance.nickname }}</span>
                </div>
                <ToggleSwitch
                  :modelValue="getPowerState(appliance) ?? false"
                  @update:modelValue="togglePower(appliance)"
                  :disabled="togglingIds.has(appliance.id)"
                />
              </div>
              <div class="flex flex-column gap-2 text-sm">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-cog text-color-secondary" style="width: 1rem;"></i>
                  <span>{{ getCurrentState(appliance) }}</span>
                </div>
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-wifi text-color-secondary" style="width: 1rem;"></i>
                  <span>{{ appliance.device?.name || '-' }}</span>
                </div>
                <div v-if="appliance.signals?.length > 0" class="flex align-items-center gap-2">
                  <i class="pi pi-send text-color-secondary" style="width: 1rem;"></i>
                  <span>カスタム信号: {{ appliance.signals.length }}件</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.grid {
  margin: -0.5rem;
}

.grid > [class*='col'] {
  padding: 0.5rem;
}

.sensor-item {
  padding: 0.5rem 1rem;
  background: var(--p-surface-100);
  border-radius: 0.5rem;
}
</style>
