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
  title:       'InvestScore: Sanlam Investments SDG Platform',
  description: 'SDG Scorecard Platform for Responsible SME Investment',
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
