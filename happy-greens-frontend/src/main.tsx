import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { initFrontendMonitoring, Sentry } from './lib/monitoring/sentry';
import { initGoogleAnalytics } from './lib/monitoring/ga';

const STALE_DEPLOY_RECOVERY_KEY = 'happy-greens:stale-deploy-recovery';

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

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

initFrontendMonitoring();
initGoogleAnalytics();

const app = <App />;

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Sentry.ErrorBoundary fallback={<div className="p-6 text-center text-sm text-slate-600">Something went wrong. Please refresh and try again.</div>}>
        {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
                {app}
            </GoogleOAuthProvider>
        ) : app}
    </Sentry.ErrorBoundary>
);
