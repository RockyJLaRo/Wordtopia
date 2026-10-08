import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// AI Studio runs the dev server with HMR disabled; silence the resulting WebSocket noise.
// Injected only while serving, so production pages don't pay for (or get altered by) it.
function devHmrShim(): Plugin {
  return {
    name: 'dev-hmr-shim',
    apply: 'serve',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          children: fs.readFileSync(path.resolve(__dirname, 'scripts/dev-hmr-shim.js'), 'utf-8'),
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig(() => {
  return {
    server: {
      hmr: false,
    },
    plugins: [
      devHmrShim(),
      react(),
      tailwindcss(),
      VitePWA({
        // 'prompt' lets src/services/pwaUpdate.ts apply updates between games instead of
        // force-reloading mid-game the moment a new version is deployed.
        registerType: 'prompt',
        injectRegister: false,
        devOptions: {
          enabled: false,
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'icon-maskable.svg', 'Vocab.txt'],
        manifest: {
          id: '/',
          name: 'Wordtopia',
          short_name: 'Wordtopia',
          description: 'A block-world vocabulary adventure game for kids.',
          theme_color: '#0284c7',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2,txt}', 'pwa-*.png', 'apple-touch-icon.png'],
          // Admin/PDF tooling is large and rarely used by kids: fetched (and runtime-cached) on demand
          // instead of being downloaded by every device during service-worker install.
          globIgnores: [
            '**/sprites/**',
            '**/assets/jspdf*',
            '**/assets/html2canvas*',
            '**/assets/purify*',
            '**/assets/index.es-*',
            '**/assets/AdminDashboard-*',
            '**/assets/StyleGuide-*',
          ],
          navigateFallback: '/',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              // Hashed build chunks that are not precached (PDF export, admin tools)
              urlPattern: /\/assets\/.*\.js$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'lazy-chunks-cache',
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Remote vocabulary data URL: NetworkFirst with offline cache fallback
              urlPattern: /^https:\/\/rockyjlaro\.github\.io\/Vocab\.txt.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'online-vocab-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Local vocabulary file: NetworkFirst with offline cache fallback
              urlPattern: /\/Vocab\.txt$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'local-vocab-cache',
                networkTimeoutSeconds: 2,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Game Sprite Assets: CacheFirst for instant offline rendering of all companion mascots & accessories
              urlPattern: /\/sprites\/.*\.(?:png|jpg|jpeg|svg|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'game-sprites-cache',
                expiration: {
                  maxEntries: 3000,
                  maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Google Fonts Stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Google Fonts Webfont files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Only the React runtime gets a dedicated long-lived vendor chunk. Everything else
          // (jsPDF, html2canvas, canvas-confetti, ...) is left to Rollup so it stays in the lazy
          // chunks that actually use it. A broad manualChunks rule previously pulled Vite's
          // preload helper into the jsPDF chunk, forcing ~600 kB of PDF code onto every page load.
          manualChunks: (id) => {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|zustand|use-sync-external-store)[\\/]/.test(id)) {
              return 'vendor-react';
            }
            // Keep icons in one cacheable chunk instead of dozens of sub-1 kB files
            // (each extra request costs a full round trip on mobile networks).
            if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) {
              return 'vendor-icons';
            }
            // Helpers shared by every game mode: one download for all of them.
            if (/[\\/]src[\\/]utils[\\/](gameUtils|gradeConfig|linguisticEngine)\.ts$/.test(id)) {
              return 'game-core';
            }
          },
        },
      },
    },
  };
});
