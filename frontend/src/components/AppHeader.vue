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
    <div class="header-content">
      <h1 class="app-title">
        <i class="pi pi-home"></i>
        Nature Remote Timer
      </h1>
      <nav class="nav">
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
  </header>
</template>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav {
  display: flex;
  gap: 8px;
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
