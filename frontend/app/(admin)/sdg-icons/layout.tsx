import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'SDG Icons' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
