<script setup lang="ts">
import { computed } from 'vue';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import type { NatureAppliance, AirconAction } from '@/types';

const props = defineProps<{
  appliance: NatureAppliance;
  modelValue: AirconAction;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: AirconAction): void;
}>();

const action = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const airconModes = computed(() => {
  if (!props.appliance.aircon?.range.modes) return [];
  return Object.keys(props.appliance.aircon.range.modes).map((mode) => ({
    label: getModeLabel(mode),
    value: mode,
  }));
});

const temperatures = computed(() => {
  const mode = action.value.operation_mode;
  if (!mode || !props.appliance.aircon?.range.modes[mode]) return [];
  return props.appliance.aircon.range.modes[mode].temp.map((t) => ({
    label: `${t}°`,
    value: t,
  }));
});

const volumes = computed(() => {
  const mode = action.value.operation_mode;
  if (!mode || !props.appliance.aircon?.range.modes[mode]) return [];
  return props.appliance.aircon.range.modes[mode].vol.map((v) => ({
    label: getVolumeLabel(v),
    value: v,
  }));
});

const directions = computed(() => {
  const mode = action.value.operation_mode;
  if (!mode || !props.appliance.aircon?.range.modes[mode]) return [];
  return props.appliance.aircon.range.modes[mode].dir.map((d) => ({
    label: getDirectionLabel(d),
    value: d,
  }));
});

const powerButtons = [
  { label: '電源ON', value: '' },
  { label: '電源OFF', value: 'power-off' },
];

const getModeLabel = (mode: string): string => {
  const labels: Record<string, string> = {
    auto: '自動',
    cool: '冷房',
    warm: '暖房',
    dry: '除湿',
    blow: '送風',
  };
  return labels[mode] || mode;
};

const getVolumeLabel = (vol: string): string => {
  const labels: Record<string, string> = {
    auto: '自動',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
  };
  return labels[vol] || vol;
};

const getDirectionLabel = (dir: string): string => {
  const labels: Record<string, string> = {
    auto: '自動',
    swing: 'スイング',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
  };
  return labels[dir] || dir;
};

const updateAction = (field: keyof AirconAction, value: string | undefined) => {
  emit('update:modelValue', { ...action.value, [field]: value });
};
</script>

<template>
  <div class="aircon-form">
    <div class="form-row">
      <label>電源</label>
      <SelectButton
        :modelValue="action.button || ''"
        :options="powerButtons"
        optionLabel="label"
        optionValue="value"
        @update:modelValue="(v) => updateAction('button', v || undefined)"
      />
    </div>

    <div class="form-row">
      <label>運転モード</label>
      <Select
        :modelValue="action.operation_mode"
        :options="airconModes"
        optionLabel="label"
        optionValue="value"
        placeholder="モードを選択"
        @update:modelValue="(v) => updateAction('operation_mode', v)"
      />
    </div>

    <div class="form-row" v-if="temperatures.length > 0">
      <label>設定温度</label>
      <Select
        :modelValue="action.temperature"
        :options="temperatures"
        optionLabel="label"
        optionValue="value"
        placeholder="温度を選択"
        @update:modelValue="(v) => updateAction('temperature', v)"
      />
    </div>

    <div class="form-row" v-if="volumes.length > 0">
      <label>風量</label>
      <Select
        :modelValue="action.air_volume"
        :options="volumes"
        optionLabel="label"
        optionValue="value"
        placeholder="風量を選択"
        @update:modelValue="(v) => updateAction('air_volume', v)"
      />
    </div>

    <div class="form-row" v-if="directions.length > 0">
      <label>風向</label>
      <Select
        :modelValue="action.air_direction"
        :options="directions"
        optionLabel="label"
        optionValue="value"
        placeholder="風向を選択"
        @update:modelValue="(v) => updateAction('air_direction', v)"
      />
    </div>
  </div>
</template>

<style scoped>
.aircon-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row label {
  font-weight: 500;
  color: #374151;
}
</style>
