<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

const navItems = [
  { path: '/', label: 'スケジュール', icon: 'pi pi-clock' },
  { path: '/devices', label: 'デバイス', icon: 'pi pi-box' },
  { path: '/logs', label: '実行履歴', icon: 'pi pi-list' },
];

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/schedules');
  }
  return route.path.startsWith(path);
};
</script>

<template>
  <nav class="bottom-navigation">
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <i :class="item.icon" class="nav-icon"></i>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  border-top: 1px solid var(--p-surface-200);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 1000;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 0;
  text-decoration: none;
  color: var(--p-text-muted-color);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--p-surface-100);
}

.nav-item.active {
  color: var(--p-primary-color);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-icon {
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
