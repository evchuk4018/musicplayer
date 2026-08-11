import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'Pulse · Your music, in one place',
  description: 'A private, self-hosted music player for your library and the music you are looking for.',
  applicationName: 'Pulse',
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: 'Pulse', statusBarStyle: 'black-translucent' },
  icons: { icon: `${basePath}/icon.svg`, apple: `${basePath}/icon.svg` }
};

export const viewport: Viewport = {
  themeColor: '#08090d',
  colorScheme: 'dark',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={inter.variable}><body>{children}</body></html>;
}
