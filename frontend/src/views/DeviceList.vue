<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { api } from '@/services/api';
import type { NatureAppliance } from '@/types';
import {
  getApplianceTypeLabel,
  getApplianceTypeSeverity,
  getAirconModeLabel,
} from '@/utils/labels';

const toast = useToast();

const appliances = ref<NatureAppliance[]>([]);
const loading = ref(true);

const loadAppliances = async () => {
  loading.value = true;
  try {
    appliances.value = await api.getAppliances();
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

onMounted(loadAppliances);
</script>

<template>
  <div class="device-list">
    <Card>
      <template #title>
        <div class="flex align-items-center justify-content-between">
          <span>デバイス一覧</span>
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            text
            rounded
            size="small"
            @click="loadAppliances"
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
        <div v-else class="grid">
          <div
            v-for="appliance in appliances"
            :key="appliance.id"
            class="col-12 md:col-6 lg:col-4"
          >
            <div class="surface-card border-round p-3 shadow-1 h-full">
              <div class="flex align-items-center justify-content-between mb-3">
                <div class="font-semibold text-lg">{{ appliance.nickname }}</div>
                <Tag
                  :value="getApplianceTypeLabel(appliance.type)"
                  :severity="getApplianceTypeSeverity(appliance.type)"
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
</style>
