import type { Metadata } from 'next';
import './globals.css';
import ClientShell from '@/components/ClientShell';

export const metadata: Metadata = {
  title: 'DSA Recall — Spaced Revision Tracker',
  description:
    'Track your DSA questions and automatically schedule spaced revisions to keep your concepts fresh.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}

