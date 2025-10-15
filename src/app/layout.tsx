import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { getServerSession } from 'next-auth';

import { Toaster } from '@/components/ui/toaster';
import { CommandPalette } from '@/features/search/components/command-palette';
import { TopBar } from '@/components/top-bar';
import { authOptions } from '@/lib/auth/auth-options';
import '@/styles/globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'Alchemy',
  description: 'Flexible web application for structured notes and AI-generated artifacts',
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
        <a
          href="#main-content"
          className="sr-only sr-only-focusable fixed left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
        >
          Skip to main content
        </a>
        <CommandPalette />
        {session?.user && <TopBar user={session.user} />}
        <div id="main-content">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
