import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Scorecard' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
