import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';
import { TopBar } from '@/components/top-bar';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'Centercode Alchemy',
  description: 'AI-powered structured note capture and artifact generation',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`dark ${figtree.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {session?.user && <TopBar user={session.user} />}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
