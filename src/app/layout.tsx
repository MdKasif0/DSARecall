import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import ClientShell from '@/components/ClientShell';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DSA Recall — Spaced Revision Tracker',
  description:
    'Track your DSA questions and automatically schedule spaced revisions to keep your concepts fresh.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}

