import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.happygreens.app',
    appName: 'Happy Greens',
    webDir: 'dist',
    bundledWebRuntime: false,
    server: {
        androidScheme: 'https',
        cleartext: false,
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 1200,
            backgroundColor: '#f3faef',
            androidSplashResourceName: 'splash',
            showSpinner: false,
        },
    },
};

export default config;
