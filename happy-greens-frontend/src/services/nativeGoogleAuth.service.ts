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

export const initializeNativeGoogleSignIn = async () => {
    if (!googleClientId) {
        throw new Error('Google login is not configured');
    }

    if (!initializationPromise) {
        initializationPromise = GoogleSignIn.initialize({
            clientId: googleClientId,
        });
    }

    try {
        await initializationPromise;
    } catch (error) {
        initializationPromise = null;
        throw error;
    }
};

export const getNativeGoogleSignInErrorMessage = (error: any) => {
    const code = String(error?.code || error?.error || '');
    const message = String(error?.message || '');
    const combined = `${code} ${message}`.toLowerCase();

    if (combined.includes('sign_in_canceled') || combined.includes('cancel')) {
        return 'Google sign-in was closed before it completed.';
    }

    if (combined.includes('client') || combined.includes('developer') || combined.includes('configuration')) {
        return 'Google sign-in is not configured correctly for this app build.';
    }

    return message || 'Google login failed';
};

export const signInWithNativeGoogle = async () => {
    await initializeNativeGoogleSignIn();

    const result = await GoogleSignIn.signIn({
        nonce: createNonce(),
    });

    if (!result.idToken) {
        throw new Error('Google did not return an ID token');
    }

    return result.idToken;
};
