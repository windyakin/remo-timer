<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import { api } from '@/services/api';
import type { Schedule } from '@/types';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const schedules = ref<Schedule[]>([]);
const loading = ref(true);

const loadSchedules = async () => {
  loading.value = true;
  try {
    schedules.value = await api.getSchedules();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: 'スケジュールの取得に失敗しました',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const toggleSchedule = async (schedule: Schedule) => {
  try {
    const updated = await api.toggleSchedule(schedule.id);
    const index = schedules.value.findIndex((s) => s.id === schedule.id);
    if (index !== -1) {
      schedules.value[index] = updated;
    }
    toast.add({
      severity: 'success',
      summary: '更新完了',
      detail: `スケジュールを${updated.isEnabled ? '有効' : '無効'}にしました`,
      life: 2000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '更新に失敗しました',
      life: 3000,
    });
    await loadSchedules();
  }
};

const editSchedule = (schedule: Schedule) => {
  router.push(`/schedules/${schedule.id}/edit`);
};

const deleteSchedule = (schedule: Schedule) => {
  confirm.require({
    message: `「${schedule.name}」を削除しますか？`,
    header: '削除の確認',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.deleteSchedule(schedule.id);
        schedules.value = schedules.value.filter((s) => s.id !== schedule.id);
        toast.add({
          severity: 'success',
          summary: '削除完了',
          detail: 'スケジュールを削除しました',
          life: 2000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'エラー',
          detail: '削除に失敗しました',
          life: 3000,
        });
      }
    },
  });
};

const formatScheduleTime = (schedule: Schedule): string => {
  if (schedule.scheduleType === 'once' && schedule.executeAt) {
    return new Date(schedule.executeAt).toLocaleString('ja-JP');
  }
  if (schedule.scheduleType === 'recurring' && schedule.cronExpression) {
    return `繰り返し: ${schedule.cronExpression}`;
  }
  return '-';
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

onMounted(loadSchedules);
</script>

<template>
  <div class="schedule-list">
    <Card>
      <template #title>
        <div class="card-header">
          <span>スケジュール一覧</span>
          <Button
            label="新規作成"
            icon="pi pi-plus"
            @click="router.push('/schedules/new')"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="schedules"
          :loading="loading"
          stripedRows
          responsiveLayout="scroll"
          :paginator="schedules.length > 10"
          :rows="10"
          emptyMessage="スケジュールがありません"
        >
          <Column field="isEnabled" header="有効" style="width: 80px">
            <template #body="{ data }">
              <ToggleSwitch
                :modelValue="data.isEnabled"
                @update:modelValue="toggleSchedule(data)"
              />
            </template>
          </Column>
          <Column field="name" header="名前" sortable />
          <Column field="applianceType" header="種類" style="width: 100px">
            <template #body="{ data }">
              <Tag
                :value="getApplianceTypeLabel(data.applianceType)"
                :severity="getApplianceTypeSeverity(data.applianceType)"
              />
            </template>
          </Column>
          <Column field="applianceName" header="デバイス" />
          <Column header="実行時刻">
            <template #body="{ data }">
              {{ formatScheduleTime(data) }}
            </template>
          </Column>
          <Column header="操作" style="width: 150px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  @click="editSchedule(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click="deleteSchedule(data)"
                />
              </div>
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

.action-buttons {
  display: flex;
  gap: 4px;
}
</style>
