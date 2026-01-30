<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Fluid from 'primevue/fluid';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import AirconActionForm from '@/components/AirconActionForm.vue';
import ButtonActionForm from '@/components/ButtonActionForm.vue';
import { api } from '@/services/api';
import type {
  NatureAppliance,
  ScheduleType,
  ApplianceAction,
  AirconAction,
} from '@/types';
import { getApplianceTypeLabel, getApplianceTypeIcon } from '@/utils/labels';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const isEdit = computed(() => !!route.params.id);
const scheduleId = computed(() =>
  route.params.id ? parseInt(route.params.id as string) : null
);

const loading = ref(!!route.params.id);
const saving = ref(false);
const appliances = ref<NatureAppliance[]>([]);

const name = ref('');
const selectedAppliance = ref<NatureAppliance | null>(null);
const scheduleType = ref<ScheduleType>('once');
const getInitialDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};
const executeAt = ref<Date | null>(getInitialDate());
const executeTime = ref<Date | null>(null);
const selectedDays = ref<number[]>([]);
const action = ref<ApplianceAction>({ type: 'AC' });

const scheduleTypeOptions = [
  { label: '一度きり', value: 'once' },
  { label: '繰り返し', value: 'recurring' },
];

// 日付入力用のcomputed (YYYY-MM-DD形式)
const executeAtString = computed({
  get: () => {
    if (!executeAt.value) return '';
    const d = executeAt.value;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  set: (val: string) => {
    if (!val) {
      executeAt.value = null;
      return;
    }
    const [year, month, day] = val.split('-').map(Number);
    executeAt.value = new Date(year, month - 1, day);
  },
});

// 時刻入力用のcomputed (HH:MM形式)
const executeTimeString = computed({
  get: () => {
    if (!executeTime.value) return '';
    const hours = String(executeTime.value.getHours()).padStart(2, '0');
    const minutes = String(executeTime.value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },
  set: (val: string) => {
    if (!val) {
      executeTime.value = null;
      return;
    }
    const [hours, minutes] = val.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    executeTime.value = date;
  },
});

// 今日の日付 (min属性用)
const todayString = computed(() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// 日付補助入力
const setDateToToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  executeAt.value = today;
};

const setDateToTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  executeAt.value = tomorrow;
};

// 時刻補助入力
const setTime = (hours: number, minutes: number = 0) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  executeTime.value = date;
};

const adjustTimeByHour = (delta: number) => {
  if (!executeTime.value) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    executeTime.value = date;
    return;
  }
  const currentHours = executeTime.value.getHours();
  const newHours = currentHours + delta;
  if (newHours < 0 || newHours > 23) {
    return;
  }
  const date = new Date(executeTime.value);
  date.setHours(newHours);
  executeTime.value = date;
};

const canDecreaseHour = computed(() => {
  if (!executeTime.value) return true;
  return executeTime.value.getHours() > 0;
});

const canIncreaseHour = computed(() => {
  if (!executeTime.value) return true;
  return executeTime.value.getHours() < 23;
});

const dayOptions = [
  { label: '日', value: 0 },
  { label: '月', value: 1 },
  { label: '火', value: 2 },
  { label: '水', value: 3 },
  { label: '木', value: 4 },
  { label: '金', value: 5 },
  { label: '土', value: 6 },
];

const applianceOptions = computed(() =>
  appliances.value.map((a) => ({
    label: `${a.nickname} (${getApplianceTypeLabel(a.type)})`,
    value: a,
  }))
);

const loadAppliances = async () => {
  try {
    appliances.value = await api.getAppliances();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: 'デバイス一覧の取得に失敗しました',
      life: 3000,
    });
  }
};

const loadSchedule = async () => {
  if (!scheduleId.value) return;

  loading.value = true;
  try {
    const schedule = await api.getSchedule(scheduleId.value);
    name.value = schedule.name || '';
    scheduleType.value = schedule.scheduleType;
    action.value = schedule.action;
    actionLoaded.value = true;

    const appliance = appliances.value.find(
      (a) => a.id === schedule.applianceId
    );
    if (appliance) {
      selectedAppliance.value = appliance;
    }

    if (schedule.executeAt) {
      const date = new Date(schedule.executeAt);
      executeAt.value = date;
      executeTime.value = date;
    }

    if (schedule.cronExpression) {
      const parts = schedule.cronExpression.split(' ');
      if (parts.length >= 5) {
        const minute = parseInt(parts[0]);
        const hour = parseInt(parts[1]);
        const daysStr = parts[4];

        executeTime.value = new Date();
        executeTime.value.setHours(hour, minute, 0, 0);

        if (daysStr !== '*') {
          selectedDays.value = daysStr.split(',').map((d) => parseInt(d));
        } else {
          selectedDays.value = [0, 1, 2, 3, 4, 5, 6];
        }
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: 'スケジュールの取得に失敗しました',
      life: 3000,
    });
    router.push('/');
  } finally {
    loading.value = false;
  }
};

// 編集時にロード済みのアクションを保持するためのフラグ
const actionLoaded = ref(false);

watch(selectedAppliance, (appliance, oldAppliance) => {
  if (!appliance) return;

  // 編集時に最初にapplianceがセットされたときは、ロード済みのactionを保持
  if (isEdit.value && actionLoaded.value && !oldAppliance) {
    return;
  }

  if (appliance.type === 'AC') {
    action.value = {
      type: 'AC',
      operation_mode: appliance.settings?.mode,
      temperature: appliance.settings?.temp,
      air_volume: appliance.settings?.vol,
      air_direction: appliance.settings?.dir,
    };
  } else if (appliance.type === 'TV') {
    action.value = { type: 'TV', button: '' };
  } else if (appliance.type === 'LIGHT') {
    action.value = { type: 'LIGHT', button: '' };
  } else {
    action.value = { type: 'IR', signal_id: '' };
  }
});

const buildCronExpression = (): string => {
  if (!executeTime.value) return '';

  const hours = executeTime.value.getHours();
  const minutes = executeTime.value.getMinutes();
  const days =
    selectedDays.value.length === 7 || selectedDays.value.length === 0
      ? '*'
      : selectedDays.value.join(',');

  return `${minutes} ${hours} * * ${days}`;
};

const buildExecuteAt = (): string | undefined => {
  if (!executeAt.value || !executeTime.value) return undefined;

  const date = new Date(executeAt.value);
  date.setHours(
    executeTime.value.getHours(),
    executeTime.value.getMinutes(),
    0,
    0
  );
  return date.toISOString();
};

const isValid = computed(() => {
  if (!selectedAppliance.value) return false;
  if (!executeTime.value) return false;

  if (scheduleType.value === 'once' && !executeAt.value) return false;
  if (scheduleType.value === 'recurring' && selectedDays.value.length === 0)
    return false;

  // アクションが正しく設定されているかチェック
  if (action.value.type === 'IR' && !action.value.signal_id) return false;
  if (action.value.type === 'TV' && !action.value.button) return false;
  if (action.value.type === 'LIGHT' && !action.value.button) return false;

  return true;
});

const save = async () => {
  if (!selectedAppliance.value) return;

  saving.value = true;
  try {
    const data = {
      name: name.value,
      applianceId: selectedAppliance.value.id,
      applianceName: selectedAppliance.value.nickname,
      applianceType: selectedAppliance.value.type,
      action: action.value,
      scheduleType: scheduleType.value,
      executeAt: scheduleType.value === 'once' ? buildExecuteAt() : undefined,
      cronExpression:
        scheduleType.value === 'recurring' ? buildCronExpression() : undefined,
    };

    if (isEdit.value && scheduleId.value) {
      await api.updateSchedule(scheduleId.value, data);
      toast.add({
        severity: 'success',
        summary: '更新完了',
        detail: 'スケジュールを更新しました',
        life: 2000,
      });
    } else {
      await api.createSchedule(data);
      toast.add({
        severity: 'success',
        summary: '作成完了',
        detail: 'スケジュールを作成しました',
        life: 2000,
      });
    }

    router.push('/');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '保存に失敗しました',
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadAppliances();
  if (isEdit.value) {
    await loadSchedule();
  }
});
</script>

<template>
  <div class="schedule-form">
    <Card>
      <template #title>
        {{ isEdit ? 'スケジュール編集' : '新規スケジュール' }}
      </template>
      <template #content>
        <div v-if="loading" class="text-center py-6">
          <i class="pi pi-spin pi-spinner text-3xl"></i>
          <p class="mt-3 text-color-secondary">読み込み中...</p>
        </div>
        <Fluid v-else>
          <form @submit.prevent="save" class="flex flex-column gap-4 mt-3">
            <div class="flex flex-column gap-2">
              <label for="name" class="font-semibold">スケジュール名 (任意)</label>
              <InputText id="name" v-model="name" placeholder="例: 朝のエアコンON" />
            </div>

            <div class="flex flex-column gap-2">
              <label for="appliance" class="font-semibold">デバイス</label>
              <Select
                id="appliance"
                v-model="selectedAppliance"
                :options="applianceOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="デバイスを選択"
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex align-items-center gap-2">
                    <i :class="getApplianceTypeIcon(slotProps.value.type)"></i>
                    <span>{{ slotProps.value.nickname }}</span>
                  </div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
                <template #option="slotProps">
                  <div class="flex align-items-center gap-2">
                    <i :class="getApplianceTypeIcon(slotProps.option.value.type)"></i>
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Select>
            </div>

            <div class="flex flex-column gap-2" v-if="selectedAppliance">
              <label class="font-semibold">アクション設定</label>
              <div class="p-3 surface-ground border-round">
                <AirconActionForm
                  v-if="selectedAppliance.type === 'AC'"
                  v-model="action as AirconAction"
                  :appliance="selectedAppliance"
                />
                <ButtonActionForm
                  v-else
                  v-model="action"
                  :appliance="selectedAppliance"
                />
              </div>
            </div>

            <div class="flex flex-column gap-2">
              <label class="font-semibold">スケジュールタイプ</label>
              <SelectButton
                v-model="scheduleType"
                :options="scheduleTypeOptions"
                optionLabel="label"
                optionValue="value"
              />
            </div>

            <div class="flex flex-column gap-2" v-if="scheduleType === 'once'">
              <label for="executeAt" class="font-semibold">実行日</label>
              <InputText
                id="executeAt"
                type="date"
                v-model="executeAtString"
                :min="todayString"
              />
              <div class="flex gap-2">
                <Button type="button" :fluid="false" label="今日" severity="secondary" size="small" class="flex-1" @click="setDateToToday" />
                <Button type="button" :fluid="false" label="明日" severity="secondary" size="small" class="flex-1" @click="setDateToTomorrow" />
              </div>
            </div>

            <div class="flex flex-column gap-2" v-if="scheduleType === 'recurring'">
              <label class="font-semibold">繰り返す曜日</label>
              <div class="flex gap-3 flex-wrap">
                <div v-for="day in dayOptions" :key="day.value" class="flex align-items-center gap-2">
                  <Checkbox
                    v-model="selectedDays"
                    :value="day.value"
                    :inputId="`day-${day.value}`"
                  />
                  <label :for="`day-${day.value}`">{{ day.label }}</label>
                </div>
              </div>
            </div>

            <div class="flex flex-column gap-2">
              <label for="executeTime" class="font-semibold">実行時刻</label>
              <div class="flex gap-2 align-items-center">
                <Button type="button" icon="pi pi-minus" severity="secondary" :disabled="!canDecreaseHour" @click="adjustTimeByHour(-1)" />
                <InputText
                  id="executeTime"
                  type="time"
                  v-model="executeTimeString"
                  class="flex-grow-1"
                />
                <Button type="button" icon="pi pi-plus" severity="secondary" :disabled="!canIncreaseHour" @click="adjustTimeByHour(1)" />
              </div>
              <div class="flex gap-2">
                <Button type="button" :fluid="false" label="朝" severity="secondary" size="small" class="flex-1" @click="setTime(7, 0)" />
                <Button type="button" :fluid="false" label="昼" severity="secondary" size="small" class="flex-1" @click="setTime(12, 0)" />
                <Button type="button" :fluid="false" label="夕方" severity="secondary" size="small" class="flex-1" @click="setTime(17, 0)" />
                <Button type="button" :fluid="false" label="夜" severity="secondary" size="small" class="flex-1" @click="setTime(20, 0)" />
              </div>
            </div>

            <div class="flex justify-content-end gap-2 mt-3">
              <Button
                type="button"
                label="キャンセル"
                severity="secondary"
                @click="router.push('/')"
              />
              <Button
                type="submit"
                :label="isEdit ? '更新' : '作成'"
                :loading="saving"
                :disabled="!isValid"
              />
            </div>
          </form>
        </Fluid>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.schedule-form {
  max-width: 600px;
  margin: 0 auto;
}
</style>
