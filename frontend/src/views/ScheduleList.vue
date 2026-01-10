<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
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
import {
  formatScheduleAction,
  getApplianceTypeLabel,
  getApplianceTypeSeverity,
} from '@/utils/labels';

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

onMounted(loadSchedules);
</script>

<template>
  <div class="schedule-list">
    <Card>
      <template #title>
        <div class="flex flex-wrap align-items-center justify-content-between gap-2">
          <span>スケジュール一覧</span>
          <Button
            label="新規作成"
            icon="pi pi-plus"
            size="small"
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
                class="ml-2"
              />
            </Tab>
            <Tab value="recurring">
              繰り返し
              <Tag
                v-if="recurringSchedules.length > 0"
                :value="recurringSchedules.length.toString()"
                severity="secondary"
                class="ml-2"
              />
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="once">
              <div v-if="loading" class="text-center py-4">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
              </div>
              <div v-else-if="onceSchedules.length === 0" class="text-center py-4 text-color-secondary">
                一度きりスケジュールがありません
              </div>
              <div v-else class="grid">
                <div
                  v-for="schedule in onceSchedules"
                  :key="schedule.id"
                  class="col-12 md:col-6 lg:col-4"
                >
                  <div class="surface-card border-round p-3 shadow-1 h-full">
                    <div class="flex align-items-start justify-content-between mb-2">
                      <div class="flex-1 min-w-0">
                        <div class="font-semibold mb-1 white-space-nowrap overflow-hidden text-overflow-ellipsis" :class="{ 'text-color-secondary font-italic': !schedule.name }">
                          {{ getScheduleDisplayName(schedule) }}
                        </div>
                        <div class="flex align-items-center gap-2 flex-wrap">
                          <Tag
                            :value="getApplianceTypeLabel(schedule.applianceType)"
                            :severity="getApplianceTypeSeverity(schedule.applianceType)"
                          />
                          <span class="text-color-secondary text-sm">{{ schedule.applianceName }}</span>
                        </div>
                      </div>
                      <div class="flex gap-1 flex-shrink-0">
                        <Button
                          icon="pi pi-pencil"
                          severity="secondary"
                          text
                          rounded
                          size="small"
                          @click="editSchedule(schedule)"
                        />
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          size="small"
                          @click="deleteSchedule(schedule)"
                        />
                      </div>
                    </div>
                    <div class="flex flex-column gap-2 text-sm mt-3">
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-send text-color-secondary"></i>
                        <span>{{ formatScheduleAction(schedule) }}</span>
                      </div>
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-clock text-color-secondary"></i>
                        <span>{{ formatScheduleTime(schedule) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            <TabPanel value="recurring">
              <div v-if="loading" class="text-center py-4">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
              </div>
              <div v-else-if="recurringSchedules.length === 0" class="text-center py-4 text-color-secondary">
                繰り返しスケジュールがありません
              </div>
              <div v-else class="grid">
                <div
                  v-for="schedule in recurringSchedules"
                  :key="schedule.id"
                  class="col-12 md:col-6 lg:col-4"
                >
                  <div
                    class="surface-card border-round p-3 shadow-1 h-full"
                    :class="{ 'opacity-60': !schedule.isEnabled }"
                  >
                    <div class="flex align-items-start justify-content-between mb-2">
                      <div class="flex align-items-center gap-2 flex-1 min-w-0">
                        <ToggleSwitch
                          :modelValue="schedule.isEnabled"
                          @update:modelValue="toggleSchedule(schedule)"
                        />
                        <div class="font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis" :class="{ 'text-color-secondary font-italic': !schedule.name }">
                          {{ getScheduleDisplayName(schedule) }}
                        </div>
                      </div>
                      <div class="flex gap-1 flex-shrink-0">
                        <Button
                          icon="pi pi-pencil"
                          severity="secondary"
                          text
                          rounded
                          size="small"
                          @click="editSchedule(schedule)"
                        />
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          size="small"
                          @click="deleteSchedule(schedule)"
                        />
                      </div>
                    </div>
                    <div class="flex align-items-center gap-2 mb-2 pl-5">
                      <Tag
                        :value="getApplianceTypeLabel(schedule.applianceType)"
                        :severity="getApplianceTypeSeverity(schedule.applianceType)"
                      />
                      <span class="text-color-secondary text-sm">{{ schedule.applianceName }}</span>
                    </div>
                    <div class="flex flex-column gap-2 text-sm pl-5">
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-send text-color-secondary"></i>
                        <span>{{ formatScheduleAction(schedule) }}</span>
                      </div>
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-clock text-color-secondary"></i>
                        <span>{{ formatScheduleTime(schedule) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
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
