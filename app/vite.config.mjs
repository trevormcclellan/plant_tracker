import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue(), VitePWA({
      filename: 'service-worker.js',
      registerType: 'prompt',
      manifest: {
        name: 'Plants!', short_name: 'Plants!', theme_color: '#198754',
        background_color: '#ffffff', display: 'standalone', start_url: '/',
        icons: [192, 512].map(size => ({ src: `/img/icons/android-chrome-${size}x${size}.png`, sizes: `${size}x${size}`, type: 'image/png' })),
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//], cleanupOutdatedCaches: true },
    })],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // Preserve existing deployments' build-time API setting during migration.
    define: { 'process.env.VUE_APP_API_ORIGIN': JSON.stringify(env.VITE_API_ORIGIN || env.VUE_APP_API_ORIGIN || '') },
    server: { proxy: { '/api': 'http://localhost:4000' } },
  };
});
