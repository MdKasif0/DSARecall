import type { Metadata } from 'next';
import './globals.css';
import ClientShell from '@/components/ClientShell';

export const metadata: Metadata = {
  metadataBase: new URL('https://dsarecall.netlify.app'),
  title: 'DSA Recall — Spaced Revision Tracker',
  description:
    'Track your DSA questions and automatically schedule spaced revisions to keep your concepts fresh.',
  openGraph: {
    title: 'DSA Recall — Spaced Revision Tracker',
    description:
      'Master Data Structures & Algorithms with automated spaced repetition and an authentic macOS Liquid Glass aesthetic.',
    url: 'https://dsarecall.netlify.app',
    siteName: 'DSA Recall',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DSA Recall — Spaced Revision Tracker',
    description:
      'Master Data Structures & Algorithms with automated spaced repetition and an authentic macOS Liquid Glass aesthetic.',
  },
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

