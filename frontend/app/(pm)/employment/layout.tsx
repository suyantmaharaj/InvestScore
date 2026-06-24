import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Employment Impact' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
