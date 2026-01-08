'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public routes that don't require authentication
  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/qr-menu');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
