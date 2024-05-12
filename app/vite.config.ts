import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "TAB BUDDY",
        short_name: "TABBUD",
        description: "A simple expense tracker",
        theme_color: "#2196f3",
        icons: [
          {
            src: "./public/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "./public/android-chrome-512x512.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "./public/android-chrome-512x512.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: [],
        runtimeCaching: [{
          urlPattern: /.*\/(api|google).*/,
          handler: 'NetworkOnly',
        }],
      },
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/google': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
