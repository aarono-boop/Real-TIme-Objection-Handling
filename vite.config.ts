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
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/valence/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const apiKey = env.VALENCE_API_KEY || 'H6rkdhcbH46tO7tmlBsLt4lxhxu1MXqC3QssYqri'
              console.log('Proxying request to:', proxyReq.path)
              if (apiKey) {
                console.log('Injecting API key header')
                proxyReq.setHeader('x-api-key', apiKey)
              } else {
                console.warn('VALENCE_API_KEY is missing in environment')
              }
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received response from target:', proxyRes.statusCode, proxyRes.statusMessage)
            })
            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err)
            })
          }
        },
      },
    },
  }
})
