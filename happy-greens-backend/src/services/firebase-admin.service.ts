import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let firebaseEnabled = false;

if (projectId && clientEmail && privateKey) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    }
    firebaseEnabled = true;
}

export const isFirebaseAdminConfigured = (): boolean => firebaseEnabled;

export const verifyFirebaseIdToken = async (idToken: string) => {
    if (!firebaseEnabled) {
        throw new Error('FIREBASE_NOT_CONFIGURED');
    }

    return admin.auth().verifyIdToken(idToken);
};
