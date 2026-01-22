<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import BottomNavigation from '@/components/BottomNavigation.vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const windowWidth = ref(window.innerWidth);
const MD_BREAKPOINT = 768;

const toastPosition = computed(() =>
  windowWidth.value >= MD_BREAKPOINT ? 'bottom-center' : 'top-center'
);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="app min-h-screen">
    <AppHeader />
    <main class="main-content">
      <div class="container px-3 py-4 md:px-4 lg:px-5">
        <RouterView />
      </div>
    </main>
    <BottomNavigation class="md:hidden" />
    <Toast :position="toastPosition" />
    <ConfirmDialog />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* ヘッダー固定分の余白 */
.main-content {
  padding-top: 60px;
}

/* ボトムナビゲーション用の余白（モバイルのみ） */
@media (max-width: 767px) {
  .main-content {
    padding-bottom: calc(70px + env(safe-area-inset-bottom));
  }
}

/* Toast のレスポンシブ対応 */
.p-toast {
  max-width: calc(100vw - 2rem);
  width: auto;
}

.p-toast .p-toast-message {
  max-width: 100%;
}

.p-toast .p-toast-message-content {
  word-break: break-word;
}

</style>
