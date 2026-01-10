<script setup lang="ts">
import { computed } from 'vue';
import Select from 'primevue/select';
import type { NatureAppliance, TVAction, LightAction, SignalAction, ApplianceAction } from '@/types';

const props = defineProps<{
  appliance: NatureAppliance;
  modelValue: ApplianceAction;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ApplianceAction): void;
}>();

const action = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const buttons = computed(() => {
  if (props.appliance.type === 'TV' && props.appliance.tv) {
    return props.appliance.tv.buttons.map((b) => ({
      label: b.label || b.name,
      value: b.name,
    }));
  }
  if (props.appliance.type === 'LIGHT' && props.appliance.light) {
    return props.appliance.light.buttons.map((b) => ({
      label: b.label || b.name,
      value: b.name,
    }));
  }
  return [];
});

const signals = computed(() => {
  return props.appliance.signals.map((s) => ({
    label: s.name,
    value: s.id,
  }));
});

const currentValue = computed(() => {
  if (action.value.type === 'IR') {
    return (action.value as SignalAction).signal_id;
  }
  return (action.value as TVAction | LightAction).button;
});

const updateAction = (value: string) => {
  if (props.appliance.type === 'IR') {
    emit('update:modelValue', { type: 'IR', signal_id: value });
  } else if (props.appliance.type === 'TV') {
    emit('update:modelValue', { type: 'TV', button: value });
  } else if (props.appliance.type === 'LIGHT') {
    emit('update:modelValue', { type: 'LIGHT', button: value });
  }
};

const typeLabel = computed(() => {
  if (props.appliance.type === 'TV') return 'テレビ操作';
  if (props.appliance.type === 'LIGHT') return '照明操作';
  return '信号';
});
</script>

<template>
  <div class="button-form">
    <div class="form-row" v-if="props.appliance.type === 'IR' || signals.length > 0">
      <label>信号を選択</label>
      <Select
        :modelValue="currentValue"
        :options="signals"
        optionLabel="label"
        optionValue="value"
        placeholder="送信する信号を選択"
        @update:modelValue="updateAction"
      />
    </div>

    <div class="form-row" v-else-if="buttons.length > 0">
      <label>{{ typeLabel }}</label>
      <Select
        :modelValue="currentValue"
        :options="buttons"
        optionLabel="label"
        optionValue="value"
        placeholder="操作を選択"
        @update:modelValue="updateAction"
      />
    </div>

    <div class="no-options" v-else>
      <p>このデバイスには選択可能な操作がありません</p>
    </div>
  </div>
</template>

<style scoped>
.button-form {
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

.no-options {
  color: #6b7280;
  font-style: italic;
}
</style>
