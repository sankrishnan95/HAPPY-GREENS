import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happygreens.admin',
  appName: 'Happy Greens Admin',
  webDir: 'dist',
  server: {
    allowNavigation: ['happy-greens-18n3.onrender.com'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#16a34a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#15803d',
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
