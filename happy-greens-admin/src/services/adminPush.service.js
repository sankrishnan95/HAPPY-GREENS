import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { registerPushSubscription } from './notification.service';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Badge } from '@capawesome/capacitor-badge';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isConfigured = Capacitor.isNativePlatform() ? true : Boolean(
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

const waitForActiveServiceWorker = async (registration) => {
  if (registration.active) return registration;

  const readyRegistration = await navigator.serviceWorker.ready;
  if (readyRegistration.active) return readyRegistration;

  return new Promise((resolve, reject) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) {
      reject(new Error('service_worker_not_active'));
      return;
    }

    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        resolve(registration);
      }
    });
  });
};

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
  if (Capacitor.isNativePlatform()) {
    return enableNativePushNotifications({ onForegroundMessage });
  }
  return enableWebPushNotifications({ onForegroundMessage });
};

const enableNativePushNotifications = async ({ onForegroundMessage }) => {
  if (!isConfigured) {
    return { enabled: false, reason: 'not_configured' };
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return { enabled: false, reason: 'permission_denied' };
    }

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // Listeners
    PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async (token) => {
      // The token string is the FCM token on Android
      try {
        await registerPushSubscription(token.value);
      } catch (err) {
        console.error('Failed to send native push token to backend:', err);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on native push registration:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      onForegroundMessage?.(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification.notification.data;
      if (data && data.link) {
        window.location.assign(data.link);
      }
    });

    return { enabled: true };
  } catch (error) {
    console.error('Failed to configure native push:', error);
    return { enabled: false, reason: error.message };
  }
};

const enableWebPushNotifications = async ({ onForegroundMessage }) => {
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
  const activeRegistration = await withTimeout(
    waitForActiveServiceWorker(registration),
    15000,
    'service_worker_activation_timeout'
  );
  const messaging = getMessaging(app);
  const token = await withTimeout(
    getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: activeRegistration,
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

    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      data: {
        url: payload.data?.link || '/',
      },
    });

    notification.onclick = () => {
      window.focus();
      const targetUrl = notification.data?.url || '/';
      window.location.assign(targetUrl);
      notification.close();
    };
  });

  return { enabled: true };
};
