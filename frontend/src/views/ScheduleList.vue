<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { api } from '@/services/api';
import type { Schedule } from '@/types';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const schedules = ref<Schedule[]>([]);
const loading = ref(true);
const activeTab = ref('once');

// 繰り返しスケジュール（次の実行時刻が近い順）
const recurringSchedules = computed(() => {
  return schedules.value
    .filter((s) => s.scheduleType === 'recurring')
    .sort((a, b) => {
      // 有効なものを優先
      if (a.isEnabled !== b.isEnabled) {
        return a.isEnabled ? -1 : 1;
      }
      // cron式でソート（文字列比較）
      return (a.cronExpression || '').localeCompare(b.cronExpression || '');
    });
});

// 一度きりスケジュール（実行時刻が近い順）
const onceSchedules = computed(() => {
  const now = new Date().getTime();
  return schedules.value
    .filter((s) => s.scheduleType === 'once')
    .sort((a, b) => {
      const timeA = a.executeAt ? new Date(a.executeAt).getTime() : Infinity;
      const timeB = b.executeAt ? new Date(b.executeAt).getTime() : Infinity;
      // 未来の予定を優先し、その中で近い順
      const isFutureA = timeA > now;
      const isFutureB = timeB > now;
      if (isFutureA !== isFutureB) {
        return isFutureA ? -1 : 1;
      }
      return timeA - timeB;
    });
});

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

const getScheduleDisplayName = (schedule: Schedule): string => {
  if (schedule.name) {
    return schedule.name;
  }
  // 名前がない場合はデバイス名を表示
  return schedule.applianceName;
};

const deleteSchedule = (schedule: Schedule) => {
  const displayName = getScheduleDisplayName(schedule);
  confirm.require({
    message: `「${displayName}」を削除しますか？`,
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
    return parseCronToReadable(schedule.cronExpression);
  }
  return '-';
};

const parseCronToReadable = (cron: string): string => {
  // cron: 分 時 日 月 曜日
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;

  const [minute, hour, , , dayOfWeek] = parts;
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  if (dayOfWeek === '*') {
    return `毎日 ${time}`;
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const days = dayOfWeek.split(',').map((d) => dayNames[parseInt(d)] || d);
  return `${days.join('・')} ${time}`;
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
        <Tabs :value="activeTab" @update:value="activeTab = String($event)">
          <TabList>
            <Tab value="once">
              一度きり
              <Tag
                v-if="onceSchedules.length > 0"
                :value="onceSchedules.length.toString()"
                severity="secondary"
                class="tab-count"
              />
            </Tab>
            <Tab value="recurring">
              繰り返し
              <Tag
                v-if="recurringSchedules.length > 0"
                :value="recurringSchedules.length.toString()"
                severity="secondary"
                class="tab-count"
              />
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="once">
              <DataTable
                :value="onceSchedules"
                :loading="loading"
                stripedRows
                responsiveLayout="scroll"
                :paginator="onceSchedules.length > 10"
                :rows="10"
                emptyMessage="一度きりスケジュールがありません"
              >
                <Column header="名前">
                  <template #body="{ data }">
                    <span :class="{ 'text-muted': !data.name }">
                      {{ getScheduleDisplayName(data) }}
                    </span>
                  </template>
                </Column>
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
            </TabPanel>
            <TabPanel value="recurring">
              <DataTable
                :value="recurringSchedules"
                :loading="loading"
                stripedRows
                responsiveLayout="scroll"
                :paginator="recurringSchedules.length > 10"
                :rows="10"
                emptyMessage="繰り返しスケジュールがありません"
              >
                <Column field="isEnabled" header="有効" style="width: 80px">
                  <template #body="{ data }">
                    <ToggleSwitch
                      :modelValue="data.isEnabled"
                      @update:modelValue="toggleSchedule(data)"
                    />
                  </template>
                </Column>
                <Column header="名前">
                  <template #body="{ data }">
                    <span :class="{ 'text-muted': !data.name }">
                      {{ getScheduleDisplayName(data) }}
                    </span>
                  </template>
                </Column>
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
            </TabPanel>
          </TabPanels>
        </Tabs>
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

.tab-count {
  margin-left: 8px;
}

.text-muted {
  color: #6b7280;
  font-style: italic;
}
</style>
