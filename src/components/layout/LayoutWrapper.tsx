'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/login') ?? false;

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}

