import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Promised Land Initiative — Admin',
        short_name: 'PLI Admin',
        description: 'Manage gallery media and site settings for Promised Land Initiative.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fbf7ef',
        theme_color: '#142255',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never cache Firebase/Cloudinary API calls — always hit the network
        // so admins never edit stale data.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('googleapis.com') ||
              url.hostname.includes('cloudinary.com') ||
              url.hostname.includes('firebaseio.com'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
