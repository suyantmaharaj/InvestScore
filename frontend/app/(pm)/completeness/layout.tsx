import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Data Completeness' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
