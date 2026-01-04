import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.restaurant',
  appName: 'Restaurant POS System',
  webDir: '.next', // Points to Next.js build output
  // Enable for live reload during development
  // Comment out for production builds
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3004',
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS,
    },
    allowMixedContent: false, // Security: prevent mixed HTTP/HTTPS
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: true, // Allow content to go under status bar
    },
  },
};

export default config;

