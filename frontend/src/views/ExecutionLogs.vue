<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import { api } from '@/services/api';
import type { ExecutionLog } from '@/types';

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

const getApplianceTypeLabel = (type: string | null): string => {
  if (!type) return '-';
  const labels: Record<string, string> = {
    AC: 'エアコン',
    TV: 'テレビ',
    LIGHT: '照明',
    IR: '赤外線',
  };
  return labels[type] || type;
};

const getApplianceTypeSeverity = (type: string | null): string => {
  if (!type) return 'secondary';
  const severities: Record<string, string> = {
    AC: 'info',
    TV: 'success',
    LIGHT: 'warn',
    IR: 'secondary',
  };
  return severities[type] || 'secondary';
};

onMounted(loadLogs);
</script>

<template>
  <div class="execution-logs">
    <Card>
      <template #title>
        <div class="card-header">
          <span>実行履歴</span>
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            text
            rounded
            @click="loadLogs"
            :loading="loading"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="logs"
          :loading="loading"
          stripedRows
          responsiveLayout="scroll"
          emptyMessage="実行履歴がありません"
        >
          <Column header="実行日時" style="width: 180px">
            <template #body="{ data }">
              {{ formatDate(data.executedAt) }}
            </template>
          </Column>
          <Column header="スケジュール">
            <template #body="{ data }">
              {{ getLogDisplayName(data) }}
            </template>
          </Column>
          <Column header="種類" style="width: 100px">
            <template #body="{ data }">
              <Tag
                :value="getApplianceTypeLabel(data.applianceType)"
                :severity="getApplianceTypeSeverity(data.applianceType)"
              />
            </template>
          </Column>
          <Column header="デバイス">
            <template #body="{ data }">
              {{ data.applianceName || '-' }}
            </template>
          </Column>
          <Column header="ステータス" style="width: 100px">
            <template #body="{ data }">
              <Tag
                :value="data.status === 'success' ? '成功' : '失敗'"
                :severity="data.status === 'success' ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column header="エラー">
            <template #body="{ data }">
              <span v-if="data.errorMessage" class="error-message">
                {{ data.errorMessage }}
              </span>
              <span v-else class="no-error">-</span>
            </template>
          </Column>
        </DataTable>
        <Paginator
          v-if="total > rows"
          :first="first"
          :rows="rows"
          :totalRecords="total"
          :rowsPerPageOptions="[10, 20, 50]"
          @page="onPageChange"
        />
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

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
}

.no-error {
  color: #9ca3af;
}
</style>
