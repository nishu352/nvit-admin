import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import History',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
