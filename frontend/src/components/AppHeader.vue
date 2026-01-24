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
  <header class="app-header">
    <div class="container px-3 md:px-4 lg:px-5">
      <div class="flex align-items-center justify-content-between py-3">
        <!-- Logo -->
        <h1 class="app-title flex align-items-center gap-2 m-0 text-xl md:text-2xl">
          <span>Remo Timer</span>
        </h1>

        <!-- Desktop Navigation & User -->
        <div class="hidden md:flex align-items-center gap-4">
          <nav class="nav flex gap-2">
            <RouterLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="nav-link"
              :class="{ active: isActive(item.path) }"
            >
              <i :class="item.icon"></i>
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #0091ff 0%, #002fff 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.app-title {
  font-weight: 600;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}
</style>
