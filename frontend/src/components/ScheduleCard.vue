<script setup lang="ts">
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import Tag from 'primevue/tag';
import type { Schedule } from '@/types';
import {
  formatScheduleAction,
  getApplianceTypeLabel,
  getApplianceTypeSeverity,
  getApplianceTypeIcon,
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
    class="schedule-card surface-card border-round p-3 shadow-1 h-full cursor-pointer hover:shadow-3 transition-all transition-duration-150 relative"
    :class="{ 'opacity-60': showToggle && !schedule.isEnabled }"
    @click="emit('edit', schedule)"
  >
    <ToggleSwitch
      v-if="showToggle"
      :modelValue="schedule.isEnabled"
      @update:modelValue="emit('toggle', schedule)"
      @click.stop
      class="absolute top-3 right-0 mr-3 mt-1"
    />
    <div
      class="font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis mt-1 mb-3"
      :class="[
        { 'text-color-secondary font-italic': !schedule.name },
        showToggle ? 'pr-6' : ''
      ]"
    >
      {{ getScheduleDisplayName(schedule) }}
    </div>
    <div class="flex align-items-center gap-2 mb-3">
      <Tag
        :value="getApplianceTypeLabel(schedule.applianceType)"
        :severity="getApplianceTypeSeverity(schedule.applianceType)"
        :icon="getApplianceTypeIcon(schedule.applianceType)"
      />
      <span class="text-color-secondary text-sm">{{ schedule.applianceName }}</span>
    </div>
    <div class="flex flex-column gap-2 text-sm mb-2">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-send text-color-secondary"></i>
        <span>{{ formatScheduleAction(schedule) }}</span>
      </div>
      <div class="flex align-items-center gap-2">
        <i class="pi pi-clock text-color-secondary"></i>
        <span>{{ formatScheduleTime(schedule) }}</span>
      </div>
    </div>
    <div class="flex justify-content-end">
      <Button
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        size="small"
        @click.stop="emit('delete', schedule)"
      />
    </div>
  </div>
</template>
