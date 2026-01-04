import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const isNative = Capacitor.isNativePlatform();

export async function setAuthToken(token: string, maxAge: number) {
  if (isNative) {
    // Store in Capacitor Preferences (persistent storage)
    await Preferences.set({
      key: 'sb-access-token',
      value: token,
    });
    
    // Also set cookie for API calls
    document.cookie = `sb-access-token=${token}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
  } else {
    // Web: use cookie only
    document.cookie = `sb-access-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key: 'sb-access-token' });
    return value;
  }
  
  // Web: read from cookie
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : null;
}

