<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { api } from '@/services/api';
import type { NatureAppliance } from '@/types';

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

const getApplianceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    AC: 'エアコン',
    TV: 'テレビ',
    LIGHT: '照明',
    IR: '赤外線',
  };
  return labels[type] || type;
};

const getApplianceTypeSeverity = (type: string): string => {
  const severities: Record<string, string> = {
    AC: 'info',
    TV: 'success',
    LIGHT: 'warn',
    IR: 'secondary',
  };
  return severities[type] || 'secondary';
};

const formatAirconSettings = (appliance: NatureAppliance): string => {
  if (appliance.type !== 'AC' || !appliance.settings) return '-';
  const { mode, temp, vol } = appliance.settings;
  const modeLabels: Record<string, string> = {
    auto: '自動',
    cool: '冷房',
    warm: '暖房',
    dry: '除湿',
    blow: '送風',
  };
  return `${modeLabels[mode] || mode} ${temp}° 風量:${vol}`;
};

onMounted(loadAppliances);
</script>

<template>
  <div class="device-list">
    <Card>
      <template #title>
        <div class="card-header">
          <span>デバイス一覧</span>
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            text
            rounded
            @click="loadAppliances"
            :loading="loading"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="appliances"
          :loading="loading"
          stripedRows
          responsiveLayout="scroll"
          emptyMessage="デバイスがありません"
        >
          <Column field="nickname" header="名前" sortable />
          <Column field="type" header="種類" style="width: 120px">
            <template #body="{ data }">
              <Tag
                :value="getApplianceTypeLabel(data.type)"
                :severity="getApplianceTypeSeverity(data.type)"
              />
            </template>
          </Column>
          <Column header="現在の設定">
            <template #body="{ data }">
              <span v-if="data.type === 'AC'">
                {{ formatAirconSettings(data) }}
              </span>
              <span v-else-if="data.type === 'LIGHT' && data.light">
                {{ data.light.state.power === 'on' ? '点灯' : '消灯' }}
              </span>
              <span v-else>-</span>
            </template>
          </Column>
          <Column header="信号数" style="width: 100px">
            <template #body="{ data }">
              {{ data.signals?.length || 0 }}
            </template>
          </Column>
          <Column header="Nature Remo">
            <template #body="{ data }">
              {{ data.device?.name || '-' }}
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
