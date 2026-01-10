import { createRouter, createWebHistory } from 'vue-router';
import ScheduleList from '@/views/ScheduleList.vue';
import ScheduleForm from '@/views/ScheduleForm.vue';
import DeviceList from '@/views/DeviceList.vue';
import ExecutionLogs from '@/views/ExecutionLogs.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'schedules',
      component: ScheduleList,
    },
    {
      path: '/schedules/new',
      name: 'schedule-new',
      component: ScheduleForm,
    },
    {
      path: '/schedules/:id/edit',
      name: 'schedule-edit',
      component: ScheduleForm,
    },
    {
      path: '/devices',
      name: 'devices',
      component: DeviceList,
    },
    {
      path: '/logs',
      name: 'logs',
      component: ExecutionLogs,
    },
  ],
});

export default router;
