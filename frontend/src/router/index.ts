import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';
import { fetchStatus, status, isLoading } from '@/composables/useAuth';
import ScheduleList from '@/views/ScheduleList.vue';
import ScheduleForm from '@/views/ScheduleForm.vue';
import DeviceList from '@/views/DeviceList.vue';
import ExecutionLogs from '@/views/ExecutionLogs.vue';

// Custom auth guard that uses BFF session-based auth
const authGuard = async (
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  // Wait for loading to complete if in progress
  if (isLoading.value) {
    // Wait for status to be fetched
    await new Promise<void>((resolve) => {
      const checkLoading = () => {
        if (!isLoading.value) {
          resolve();
        } else {
          setTimeout(checkLoading, 50);
        }
      };
      checkLoading();
    });
  }

  // If status hasn't been fetched yet, fetch it now
  if (status.value === null) {
    await fetchStatus();
  }

  // If auth is not enabled, allow access
  if (!status.value?.authEnabled) {
    next();
    return;
  }

  // If authenticated, allow access
  if (status.value?.isAuthenticated) {
    next();
    return;
  }

  // Not authenticated - redirect to login
  window.location.href = '/api/auth/login';
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'schedules',
      component: ScheduleList,
      beforeEnter: authGuard,
    },
    {
      path: '/schedules/new',
      name: 'schedule-new',
      component: ScheduleForm,
      beforeEnter: authGuard,
    },
    {
      path: '/schedules/:id/edit',
      name: 'schedule-edit',
      component: ScheduleForm,
      beforeEnter: authGuard,
    },
    {
      path: '/devices',
      name: 'devices',
      component: DeviceList,
      beforeEnter: authGuard,
    },
    {
      path: '/logs',
      name: 'logs',
      component: ExecutionLogs,
      beforeEnter: authGuard,
    },
  ],
});

export default router;
