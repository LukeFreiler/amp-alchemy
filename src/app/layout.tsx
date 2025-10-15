import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';

import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'Centercode Next.js Starter',
  description: 'Production-ready Next.js starter with TypeScript, shadcn/ui, and Postgres',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${figtree.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
