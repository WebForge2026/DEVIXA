import type { MetadataRoute } from 'next';

/** /manifest.webmanifest — home-screen icon and colours on Android / installable PWA metadata. */
const manifest = (): MetadataRoute.Manifest => ({
  name: 'Devixa — Digital Engineering',
  short_name: 'Devixa',
  description: 'Websites, webshops and business systems — EU-hosted, fixed price.',
  start_url: '/',
  display: 'standalone',
  background_color: '#050507',
  theme_color: '#050507',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
});

export default manifest;
