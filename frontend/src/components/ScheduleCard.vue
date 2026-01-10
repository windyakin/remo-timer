<script setup lang="ts">
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import Tag from 'primevue/tag';
import type { Schedule } from '@/types';
import {
  formatScheduleAction,
  getApplianceTypeLabel,
  getApplianceTypeSeverity,
} from '@/utils/labels';

defineProps<{
  schedule: Schedule;
  showToggle?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', schedule: Schedule): void;
  (e: 'delete', schedule: Schedule): void;
  (e: 'toggle', schedule: Schedule): void;
}>();

const getScheduleDisplayName = (schedule: Schedule): string => {
  if (schedule.name) {
    return schedule.name;
  }
  return schedule.applianceName;
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
</script>

<template>
  <div
    class="surface-card border-round p-3 shadow-1 h-full"
    :class="{ 'opacity-60': showToggle && !schedule.isEnabled }"
  >
    <div class="flex align-items-start justify-content-between mb-2">
      <div class="flex align-items-center gap-2 flex-1 min-w-0">
        <ToggleSwitch
          v-if="showToggle"
          :modelValue="schedule.isEnabled"
          @update:modelValue="emit('toggle', schedule)"
        />
        <div
          class="font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis"
          :class="{ 'text-color-secondary font-italic': !schedule.name }"
        >
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
          @click="emit('edit', schedule)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          size="small"
          @click="emit('delete', schedule)"
        />
      </div>
    </div>
    <div class="flex align-items-center gap-2 mb-2" :class="{ 'pl-5': showToggle }">
      <Tag
        :value="getApplianceTypeLabel(schedule.applianceType)"
        :severity="getApplianceTypeSeverity(schedule.applianceType)"
      />
      <span class="text-color-secondary text-sm">{{ schedule.applianceName }}</span>
    </div>
    <div class="flex flex-column gap-2 text-sm" :class="{ 'pl-5': showToggle }">
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
</template>
