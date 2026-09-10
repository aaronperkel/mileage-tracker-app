import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

/*
 * Self-hosted from committed files rather than next/font/google, so a build
 * never depends on reaching Google. Same two faces as ../vermont-plate-log.
 */
const publicSans = localFont({
  variable: '--font-public-sans',
  display: 'swap',
  src: [
    { path: '../assets/fonts/public-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/public-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/public-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
});

/* Kept exclusive to the odometer drums. Nothing else uses a condensed face. */
const barlowCondensed = localFont({
  variable: '--font-barlow-condensed',
  display: 'swap',
  src: [
    { path: '../assets/fonts/barlow-semi-condensed-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  title: { default: 'Mileage', template: '%s — Mileage' },
  description: 'Odometer readings for the monthly UVM mileage log.',
  applicationName: 'Mileage',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Mileage',
    /* Lets the page paint under the status bar; needs the safe-area padding below. */
    statusBarStyle: 'black-translucent',
  },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#23262a',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${publicSans.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
