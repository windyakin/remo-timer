<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';

const route = useRoute();
const mobileMenuOpen = ref(false);

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

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};
</script>

<template>
  <header class="app-header">
    <div class="container px-3 md:px-4 lg:px-5">
      <div class="flex align-items-center justify-content-between py-3">
        <!-- Logo -->
        <h1 class="app-title flex align-items-center gap-2 m-0 text-xl md:text-2xl">
          <i class="pi pi-home"></i>
          <span class="hidden sm:inline">Nature Remote Timer</span>
          <span class="sm:hidden">NR Timer</span>
        </h1>

        <!-- Desktop Navigation -->
        <nav class="nav hidden md:flex gap-2">
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

        <!-- Mobile Menu Button -->
        <Button
          class="md:hidden"
          icon="pi pi-bars"
          severity="secondary"
          aria-label="メニュー"
          @click="mobileMenuOpen = true"
        />
      </div>
    </div>

    <!-- Mobile Drawer -->
    <Drawer
      :visible="mobileMenuOpen"
      header="メニュー"
      position="right"
      class="mobile-drawer"
      @update:visible="mobileMenuOpen = $event"
    >
      <nav class="flex flex-column gap-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="mobile-nav-link flex align-items-center gap-2 p-3 border-round"
          :class="{ active: isActive(item.path) }"
          @click="closeMobileMenu"
        >
          <i :class="item.icon" class="text-lg"></i>
          <span class="text-lg">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </Drawer>
  </header>
</template>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.mobile-nav-link {
  color: var(--p-text-color);
  text-decoration: none;
  transition: background-color 0.2s;
}

.mobile-nav-link:hover {
  background-color: var(--p-surface-100);
}

.mobile-nav-link.active {
  background-color: var(--p-primary-100);
  color: var(--p-primary-700);
}
</style>
