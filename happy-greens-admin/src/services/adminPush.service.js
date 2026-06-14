import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { registerPushSubscription } from './notification.service';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  firebaseConfig.messagingSenderId &&
  vapidKey
);

let foregroundUnsubscribe = null;

const withTimeout = (promise, ms, reason) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(reason)), ms);
    }),
  ]);

const getFirebaseApp = () => {
  if (!isConfigured) return null;
  return getApps()[0] || initializeApp(firebaseConfig);
};

const getServiceWorkerUrl = () => {
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    messagingSenderId: firebaseConfig.messagingSenderId,
  });

  return `/firebase-messaging-sw.js?${params.toString()}`;
};

export const isAdminPushConfigured = () => isConfigured;

export const enableAdminPushNotifications = async ({ onForegroundMessage } = {}) => {
  if (!isConfigured || !('serviceWorker' in navigator) || !('Notification' in window)) {
    return { enabled: false, reason: 'not_configured' };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) return { enabled: false, reason: 'not_supported' };

  const permission = await withTimeout(
    Notification.requestPermission(),
    15000,
    'notification_permission_timeout'
  );
  if (permission !== 'granted') return { enabled: false, reason: 'permission_denied' };

  const app = getFirebaseApp();
  if (!app) return { enabled: false, reason: 'not_configured' };

  const registration = await withTimeout(
    navigator.serviceWorker.register(getServiceWorkerUrl()),
    15000,
    'service_worker_registration_timeout'
  );
  const messaging = getMessaging(app);
  const token = await withTimeout(
    getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    }),
    20000,
    'firebase_token_timeout'
  );

  if (!token) return { enabled: false, reason: 'token_unavailable' };

  await withTimeout(
    registerPushSubscription(token),
    15000,
    'push_subscription_registration_timeout'
  );

  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
  }

  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    onForegroundMessage?.(payload);

    const title = payload.notification?.title || payload.data?.title || 'Happy Greens';
    const body = payload.notification?.body || payload.data?.body || 'New admin notification';

    if (document.visibilityState === 'visible') return;
    new Notification(title, {
      body,
      icon: '/logo.png',
      data: {
        url: payload.data?.link || '/',
      },
    });
  });

  return { enabled: true };
};
