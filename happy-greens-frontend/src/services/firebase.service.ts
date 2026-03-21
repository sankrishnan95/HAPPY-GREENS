import { initializeApp, getApps } from 'firebase/app';
import { RecaptchaVerifier, getAuth, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const isConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const app = isConfigured
    ? (getApps()[0] ?? initializeApp(firebaseConfig))
    : null;

export const isFirebasePhoneAuthConfigured = () => isConfigured && !!app;

export const getFirebaseAuth = () => {
    if (!app) {
        throw new Error('Firebase phone auth is not configured');
    }
    return getAuth(app);
};

export const getOrCreateRecaptchaVerifier = (containerId: string) => {
    const auth = getFirebaseAuth();
    const existing = (window as any).__happyGreensRecaptchaVerifier as RecaptchaVerifier | undefined;
    if (existing) return existing;

    const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
    });

    (window as any).__happyGreensRecaptchaVerifier = verifier;
    return verifier;
};

export const requestPhoneOtp = async (phone: string): Promise<ConfirmationResult> => {
    const verifier = getOrCreateRecaptchaVerifier('firebase-recaptcha-container');
    const auth = getFirebaseAuth();
    return signInWithPhoneNumber(auth, phone, verifier);
};
