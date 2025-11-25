import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    define: {
      '__APP_HAS_API_KEY__': JSON.stringify(!!env.VALENCE_API_KEY)
    },
    server: {
      proxy: {
        '/api/valence': {
          target: 'https://api.getvalenceai.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/valence/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (env.VALENCE_API_KEY) {
                proxyReq.setHeader('x-api-key', env.VALENCE_API_KEY)
              }
            })
          }
        },
      },
    },
  }
})
