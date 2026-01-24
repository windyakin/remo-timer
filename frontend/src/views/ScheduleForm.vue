<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Fluid from 'primevue/fluid';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import DatePicker from 'primevue/datepicker';
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
          <form @submit.prevent="save" class="form mt-3">
            <div class="form-section">
              <label for="name">スケジュール名 (任意)</label>
              <InputText id="name" v-model="name" placeholder="例: 朝のエアコンON" />
            </div>

            <div class="form-section">
              <label for="appliance">デバイス</label>
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

            <div class="form-section" v-if="selectedAppliance">
              <label>アクション設定</label>
              <div class="action-form-wrapper">
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

            <div class="form-section">
              <label>スケジュールタイプ</label>
              <SelectButton
                v-model="scheduleType"
                :options="scheduleTypeOptions"
                optionLabel="label"
                optionValue="value"
              />
            </div>

            <div class="form-section" v-if="scheduleType === 'once'">
              <label for="executeAt">実行日</label>
              <DatePicker
                id="executeAt"
                v-model="executeAt"
                dateFormat="yy/mm/dd"
                :minDate="new Date()"
                placeholder="日付を選択"
              />
            </div>

            <div class="form-section" v-if="scheduleType === 'recurring'">
              <label>繰り返す曜日</label>
              <div class="day-checkboxes">
                <div v-for="day in dayOptions" :key="day.value" class="day-item">
                  <Checkbox
                    v-model="selectedDays"
                    :value="day.value"
                    :inputId="`day-${day.value}`"
                  />
                  <label :for="`day-${day.value}`">{{ day.label }}</label>
                </div>
              </div>
            </div>

            <div class="form-section">
              <label for="executeTime">実行時刻</label>
              <DatePicker
                id="executeTime"
                v-model="executeTime"
                timeOnly
                hourFormat="24"
                placeholder="時刻を選択"
              />
            </div>

            <div class="form-actions">
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

.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-section > label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.action-form-wrapper {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.day-checkboxes {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.day-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
