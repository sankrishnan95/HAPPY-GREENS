import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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
