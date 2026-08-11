import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Pulse · Your music, in one place',
  description: 'A private, self-hosted music player for your library and the music you are looking for.',
  applicationName: 'Pulse',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Pulse', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' }
};

export const viewport: Viewport = {
  themeColor: '#08090d',
  colorScheme: 'dark',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={inter.variable}><body>{children}</body></html>;
}
