import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title:       'INvestScore — Sanlam Investments SDG Platform',
  description: 'SDG Scorecard Platform for Responsible SME Investment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-sanlam-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}
