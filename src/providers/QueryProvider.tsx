'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

const FIVE_MINUTES = 5 * 60 * 1000;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000,
        gcTime: FIVE_MINUTES,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,  // re-sync stale data when network comes back
        retry: 3,
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
