import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import SplashWrapper from '@/components/shared/SplashWrapper';
import { TourProvider } from '@/contexts/TourContext';
import TourOverlay from '@/components/shared/TourOverlay';

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title:       'InvestScore — Sanlam Investments SDG Platform',
  description: 'SDG impact scoring platform for Sanlam Investments. Track, benchmark and improve ESG performance across your SMME portfolio.',
  keywords:    ['SDG', 'ESG', 'impact investing', 'Sanlam', 'SME scorecard', 'responsible investment'],
  authors:     [{ name: 'Sanlam Investments' }],
  icons: {
    icon:             [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple:            '/apple-touch-icon.png',
    other:            [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest:    '/site.webmanifest',
  openGraph: {
    title:       'InvestScore — Sanlam Investments SDG Platform',
    description: 'SDG impact scoring platform for Sanlam Investments. Track, benchmark and improve ESG performance across your SMME portfolio.',
    type:        'website',
    locale:      'en_ZA',
    siteName:    'InvestScore',
  },
  twitter: {
    card:        'summary',
    title:       'InvestScore — Sanlam Investments SDG Platform',
    description: 'SDG impact scoring for responsible SMME investment.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-screen" style={{ background: 'var(--surface-page)' }}>
        <TourProvider>
          <ThemeProvider>
            <SplashWrapper>
              {children}
            </SplashWrapper>
          </ThemeProvider>
          <TourOverlay />
        </TourProvider>
      </body>
    </html>
  );
}
