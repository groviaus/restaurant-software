'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AlertCircle } from 'lucide-react';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <span>No internet connection. Some features may be unavailable.</span>
    </div>
  );
}

