import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Submit SDG Report' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
