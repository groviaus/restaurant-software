import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initializeStatusBar() {
  if (!Capacitor.isNativePlatform()) {
    return; // Only run on native platforms
  }

  try {
    // Set status bar to overlay content (transparent)
    await StatusBar.setOverlaysWebView({ overlay: true });
    
    // Set status bar style based on theme
    // You can make this dynamic based on your theme
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Set background color (optional, for when not overlaying)
    await StatusBar.setBackgroundColor({ color: '#000000' });
  } catch (error) {
    console.error('Failed to initialize status bar:', error);
  }
}

