import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

import { getUser, getUserProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Restaurant POS System',
  description: 'Restaurant Point of Sale and Multi-Outlet Management System',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const profile = user ? await getUserProfile() : null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider initialUser={user} initialProfile={profile}>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

