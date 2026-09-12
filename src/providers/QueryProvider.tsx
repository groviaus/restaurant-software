'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

const FIVE_MINUTES = 5 * 60 * 1000;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,      // 1 minute stale-time: instant route transitions without refetch waterfalls
        gcTime: FIVE_MINUTES,
        refetchOnWindowFocus: false, // avoid redundant refetches when clicking around the app
        refetchOnReconnect: true,  // re-sync stale data when network comes back
        retry: 2,
        networkMode: 'online',     // pause queries while offline, resume on reconnect
      },
      mutations: {
        networkMode: 'online',     // pause mutations while offline, fire when back online
        retry: 2,                  // retry failed mutations up to 2 times
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
