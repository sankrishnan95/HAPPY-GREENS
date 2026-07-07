import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { Capacitor } from '@capacitor/core';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let initializationPromise: Promise<void> | null = null;

const createNonce = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const isNativeGoogleSignInAvailable = () => {
    return Capacitor.isNativePlatform() && Boolean(googleClientId);
};

export const signInWithNativeGoogle = async () => {
    if (!googleClientId) {
        throw new Error('Google login is not configured');
    }

    if (!initializationPromise) {
        initializationPromise = GoogleSignIn.initialize({
            clientId: googleClientId,
        });
    }

    await initializationPromise;

    const result = await GoogleSignIn.signIn({
        nonce: createNonce(),
    });

    if (!result.idToken) {
        throw new Error('Google did not return an ID token');
    }

    return result.idToken;
};
