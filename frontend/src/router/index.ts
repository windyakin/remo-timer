import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from '@auth0/auth0-vue';
import { AUTH_ENABLED } from '@/config/auth';
import ScheduleList from '@/views/ScheduleList.vue';
import ScheduleForm from '@/views/ScheduleForm.vue';
import DeviceList from '@/views/DeviceList.vue';
import ExecutionLogs from '@/views/ExecutionLogs.vue';

// 認証が有効な場合のみ authGuard を適用
const optionalAuthGuard = AUTH_ENABLED ? authGuard : undefined;

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'schedules',
      component: ScheduleList,
      beforeEnter: optionalAuthGuard,
    },
    {
      path: '/schedules/new',
      name: 'schedule-new',
      component: ScheduleForm,
      beforeEnter: optionalAuthGuard,
    },
    {
      path: '/schedules/:id/edit',
      name: 'schedule-edit',
      component: ScheduleForm,
      beforeEnter: optionalAuthGuard,
    },
    {
      path: '/devices',
      name: 'devices',
      component: DeviceList,
      beforeEnter: optionalAuthGuard,
    },
    {
      path: '/logs',
      name: 'logs',
      component: ExecutionLogs,
      beforeEnter: optionalAuthGuard,
    },
  ],
});

export default router;
