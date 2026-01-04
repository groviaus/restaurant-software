import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // Web: use browser API
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Native: use Capacitor Network plugin
      Network.getStatus().then(status => setIsOnline(status.connected));
      
      let listenerHandle: Awaited<ReturnType<typeof Network.addListener>> | null = null;
      
      Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
      }).then(handle => {
        listenerHandle = handle;
      });
      
      return () => {
        if (listenerHandle) {
          listenerHandle.remove();
        }
      };
    }
  }, []);

  return isOnline;
}

