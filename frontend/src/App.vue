<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
</script>

<template>
  <div class="app min-h-screen">
    <AppHeader />
    <main class="main-content">
      <div class="container px-3 py-4 md:px-4 lg:px-5">
        <RouterView />
      </div>
    </main>
    <Toast position="bottom-center" />
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

/* Toast のスマホ対応 */
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
