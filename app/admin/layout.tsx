import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import '../globals.css';

const sans = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Command Center · Devixa',
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#09090B', colorScheme: 'dark' };

/** Separate root layout: the admin never loads the public site's 3D scene, cursor or smooth scroll. */
const AdminRootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" translate="no" className={`${sans.variable} ${mono.variable} dark bg-[#09090B]`}>
    <body className="!bg-[#09090B] font-sans antialiased [background-image:none]">{children}</body>
  </html>
);

export default AdminRootLayout;
