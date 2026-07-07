import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

// Initialize Capacitor plugins on native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#15803d' });
  SplashScreen.hide();

  // Handle Android hardware back button
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });
}

const STALE_DEPLOY_RECOVERY_KEY = 'happy-greens-admin:stale-deploy-recovery';

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();

    const hasRetried = window.sessionStorage.getItem(STALE_DEPLOY_RECOVERY_KEY) === '1';
    if (hasRetried) {
      return;
    }

    window.sessionStorage.setItem(STALE_DEPLOY_RECOVERY_KEY, '1');
    window.location.reload();
  });

  window.sessionStorage.removeItem(STALE_DEPLOY_RECOVERY_KEY);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
