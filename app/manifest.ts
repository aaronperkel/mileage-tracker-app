import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mileage',
    short_name: 'Mileage',
    description: 'Odometer readings for the monthly UVM mileage log.',
    start_url: '/',
    /* Add to Home Screen should open straight onto the field, with no chrome. */
    display: 'standalone',
    /* The drum graphite, so the status bar and splash match the odometer. */
    theme_color: '#23262a',
    background_color: '#f4f6f6',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
