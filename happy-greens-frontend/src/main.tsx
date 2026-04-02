import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

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

const app = <App />;

ReactDOM.createRoot(document.getElementById('root')!).render(
    googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
            {app}
        </GoogleOAuthProvider>
    ) : app
);
