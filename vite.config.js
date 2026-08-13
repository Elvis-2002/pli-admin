import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Deployed as a GitHub Pages *project* site (no custom domain), so it
// lives at https://elvis-2002.github.io/pli-admin/ — everything has to
// be prefixed with this subfolder, not served from the root.
const BASE = '/pli-admin/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Promised Land Initiative — Admin',
        short_name: 'PLI Admin',
        description: 'Manage gallery media and site settings for Promised Land Initiative.',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#fbf7ef',
        theme_color: '#142255',
        icons: [
          { src: `${BASE}icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${BASE}icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${BASE}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
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