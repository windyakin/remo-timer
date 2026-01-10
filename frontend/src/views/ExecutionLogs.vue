<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import { api } from '@/services/api';
import type { ExecutionLog } from '@/types';
import {
  getApplianceTypeLabel,
  getApplianceTypeSeverity,
} from '@/utils/labels';

const toast = useToast();

const logs = ref<ExecutionLog[]>([]);
const loading = ref(true);
const total = ref(0);
const first = ref(0);
const rows = ref(20);

const loadLogs = async () => {
  loading.value = true;
  try {
    const response = await api.getLogs(rows.value, first.value);
    logs.value = response.logs;
    total.value = response.total;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '実行履歴の取得に失敗しました',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const onPageChange = (event: { first: number; rows: number }) => {
  first.value = event.first;
  rows.value = event.rows;
  loadLogs();
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ja-JP');
};

const getLogDisplayName = (log: ExecutionLog): string => {
  // ログに保存された名前を優先
  if (log.scheduleName) {
    return log.scheduleName;
  }
  if (log.applianceName) {
    return log.applianceName;
  }
  // フォールバック: スケジュールが残っている場合
  if (log.schedule) {
    return log.schedule.name || log.schedule.applianceName;
  }
  return '削除済みスケジュール';
};

onMounted(loadLogs);
</script>

<template>
  <div class="execution-logs">
    <Card>
      <template #title>
        <div class="flex align-items-center justify-content-between">
          <span>実行履歴</span>
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            text
            rounded
            size="small"
            @click="loadLogs"
            :loading="loading"
          />
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="text-center py-4">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>
        <div v-else-if="logs.length === 0" class="text-center py-4 text-color-secondary">
          実行履歴がありません
        </div>
        <div v-else class="flex flex-column gap-3">
          <div
            v-for="log in logs"
            :key="log.id"
            class="surface-card border-round p-3 shadow-1"
          >
            <div class="flex align-items-start justify-content-between gap-3 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex align-items-center gap-2 mb-2 flex-wrap">
                  <Tag
                    :value="log.status === 'success' ? '成功' : '失敗'"
                    :severity="log.status === 'success' ? 'success' : 'danger'"
                  />
                  <Tag
                    v-if="log.applianceType"
                    :value="getApplianceTypeLabel(log.applianceType)"
                    :severity="getApplianceTypeSeverity(log.applianceType)"
                  />
                  <span class="font-semibold">{{ getLogDisplayName(log) }}</span>
                </div>
                <div class="flex flex-column gap-1 text-sm">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-clock text-color-secondary" style="width: 1rem;"></i>
                    <span>{{ formatDate(log.executedAt) }}</span>
                  </div>
                  <div v-if="log.applianceName" class="flex align-items-center gap-2">
                    <i class="pi pi-box text-color-secondary" style="width: 1rem;"></i>
                    <span>{{ log.applianceName }}</span>
                  </div>
                  <div v-if="log.errorMessage" class="flex align-items-start gap-2 text-red-500">
                    <i class="pi pi-exclamation-circle" style="width: 1rem; margin-top: 2px;"></i>
                    <span>{{ log.errorMessage }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Paginator
          v-if="total > rows"
          :first="first"
          :rows="rows"
          :totalRecords="total"
          :rowsPerPageOptions="[10, 20, 50]"
          @page="onPageChange"
          class="mt-4"
        />
      </template>
    </Card>
  </div>
</template>
