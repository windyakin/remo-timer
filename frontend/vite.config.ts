import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Remo Timer',
        short_name: 'Remo Timer',
        description: 'Nature Remo デバイスを使用した家電スケジュール制御システム',
        theme_color: '#0091ff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // SPAのナビゲーションフォールバック
        navigateFallback: 'index.html',
        // /api/ パスはService Workerのナビゲーションハンドリングから除外
        // これにより認証リダイレクト（/api/auth/login → Auth0）が正常に動作する
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // /api/auth/* 以外のAPIをキャッシュ
            // 認証エンドポイントはリダイレクトを返すためキャッシュしない
            urlPattern: /\/api\/(?!auth\/).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'backend-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
