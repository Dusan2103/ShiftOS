import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ShiftOS',
  description:
    'Kontrola pristupa sektorima proizvodnog pogona i detekcija anomalija u trajanju zadataka.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/favicon-64.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2E6BF0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={inter.variable}>
      <body className="min-h-dvh bg-[var(--color-bg)] antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
