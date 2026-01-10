<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import type { NatureAppliance, TVAction, LightAction, SignalAction, ApplianceAction } from '@/types';
import { getTVButtonLabel, getLightButtonLabel } from '@/utils/labels';

const props = defineProps<{
  appliance: NatureAppliance;
  modelValue: ApplianceAction;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ApplianceAction): void;
}>();

// 操作タイプ: 'button' (TV/LIGHTの標準ボタン) または 'signal' (カスタム信号)
const actionMode = ref<'button' | 'signal'>('button');

const buttons = computed(() => {
  if (props.appliance.type === 'TV' && props.appliance.tv) {
    return props.appliance.tv.buttons.map((b) => ({
      label: getTVButtonLabel(b.name),
      value: b.name,
    }));
  }
  if (props.appliance.type === 'LIGHT' && props.appliance.light) {
    return props.appliance.light.buttons.map((b) => ({
      label: getLightButtonLabel(b.name),
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

// 両方のオプションがあるかどうか
const hasBothOptions = computed(() => {
  return buttons.value.length > 0 && signals.value.length > 0;
});

// IR タイプのデバイスか
const isIRDevice = computed(() => props.appliance.type === 'IR');

const modeOptions = computed(() => [
  { label: typeLabel.value, value: 'button' },
  { label: 'カスタム信号', value: 'signal' },
]);

const currentValue = computed(() => {
  if (props.modelValue.type === 'IR') {
    return (props.modelValue as SignalAction).signal_id;
  }
  return (props.modelValue as TVAction | LightAction).button;
});

// modelValue が変わったときにモードを更新
watch(() => props.modelValue, (newValue) => {
  if (newValue.type === 'IR') {
    actionMode.value = 'signal';
  } else {
    actionMode.value = 'button';
  }
}, { immediate: true });

const updateAction = (value: string) => {
  if (actionMode.value === 'signal' || isIRDevice.value) {
    emit('update:modelValue', { type: 'IR', signal_id: value });
  } else if (props.appliance.type === 'TV') {
    emit('update:modelValue', { type: 'TV', button: value });
  } else if (props.appliance.type === 'LIGHT') {
    emit('update:modelValue', { type: 'LIGHT', button: value });
  }
};

// モードが変わったときに値をリセット
const onModeChange = (mode: 'button' | 'signal') => {
  actionMode.value = mode;
  if (mode === 'signal') {
    emit('update:modelValue', { type: 'IR', signal_id: '' });
  } else if (props.appliance.type === 'TV') {
    emit('update:modelValue', { type: 'TV', button: '' });
  } else if (props.appliance.type === 'LIGHT') {
    emit('update:modelValue', { type: 'LIGHT', button: '' });
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
    <!-- IRデバイスの場合は信号のみ -->
    <div class="form-row" v-if="isIRDevice">
      <label>送信する信号</label>
      <Select
        v-if="signals.length > 0"
        :modelValue="currentValue"
        :options="signals"
        optionLabel="label"
        optionValue="value"
        placeholder="信号を選択"
        @update:modelValue="updateAction"
      />
      <p v-else class="no-options">このデバイスには登録された信号がありません</p>
    </div>

    <!-- TV/LIGHTの場合 -->
    <template v-else>
      <!-- 両方のオプションがある場合はモード選択を表示 -->
      <div class="form-row" v-if="hasBothOptions">
        <label>操作タイプ</label>
        <SelectButton
          :modelValue="actionMode"
          :options="modeOptions"
          optionLabel="label"
          optionValue="value"
          @update:modelValue="onModeChange"
        />
      </div>

      <!-- 標準ボタン -->
      <div class="form-row" v-if="(actionMode === 'button' || !hasBothOptions) && buttons.length > 0">
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

      <!-- カスタム信号 -->
      <div class="form-row" v-if="(actionMode === 'signal' || (!hasBothOptions && buttons.length === 0)) && signals.length > 0">
        <label>カスタム信号</label>
        <Select
          :modelValue="currentValue"
          :options="signals"
          optionLabel="label"
          optionValue="value"
          placeholder="信号を選択"
          @update:modelValue="updateAction"
        />
      </div>

      <!-- どちらもない場合 -->
      <div class="no-options" v-if="buttons.length === 0 && signals.length === 0">
        <p>このデバイスには選択可能な操作がありません</p>
      </div>
    </template>
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
