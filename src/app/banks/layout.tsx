import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Banks & NBFCs',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
