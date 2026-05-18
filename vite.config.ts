import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import {resolve} from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    exclude: ['NeteaseCloudMusicApi'],
  },
  build: {
    rolldownOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lyric: resolve(__dirname, 'lyric.html'),
      }
    }
  },
})
