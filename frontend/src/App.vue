<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watchEffect } from 'vue';
import { RouterView } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import AppHeader from '@/components/AppHeader.vue';
import BottomNavigation from '@/components/BottomNavigation.vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import ProgressSpinner from 'primevue/progressspinner';
import { setAuthTokenGetter } from '@/services/api';
import { AUTH_ENABLED } from '@/config/auth';

// Auth0 composable（認証無効時は inject が失敗するので try-catch）
let auth0: ReturnType<typeof useAuth0> | null = null;
try {
  if (AUTH_ENABLED) {
    auth0 = useAuth0();
  }
} catch {
  // Auth0 プラグインが登録されていない場合は無視
}

const isLoading = computed(() => auth0?.isLoading.value ?? false);
const isAuthenticated = computed(() => auth0?.isAuthenticated.value ?? false);

const windowWidth = ref(window.innerWidth);
const MD_BREAKPOINT = 768;

const toastPosition = computed(() =>
  windowWidth.value >= MD_BREAKPOINT ? 'bottom-center' : 'top-center'
);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Set up API token getter when authenticated
watchEffect(() => {
  if (auth0 && isAuthenticated.value) {
    setAuthTokenGetter(auth0.getAccessTokenSilently);
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div v-if="isLoading" class="loading-container">
    <ProgressSpinner />
    <p class="mt-3">Loading...</p>
  </div>
  <div v-else class="app min-h-screen">
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

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
