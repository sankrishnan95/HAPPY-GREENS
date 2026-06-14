import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let firebaseEnabled = false;
const adminUrl = process.env.ADMIN_URL?.replace(/\/+$/, '') || 'https://happygreensadmin.vercel.app';

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

export const sendFirebasePushToTokens = async (
    tokens: string[],
    payload: {
        title: string;
        body: string;
        link?: string | null;
        data?: Record<string, string>;
    }
) => {
    if (!firebaseEnabled || tokens.length === 0) {
        return { sent: 0, invalidTokens: [] as string[] };
    }

    const clickLink = payload.link?.startsWith('http')
        ? payload.link
        : `${adminUrl}${payload.link?.startsWith('/') ? payload.link : `/${payload.link || ''}`}`;

    const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: {
            link: clickLink,
            ...(payload.data || {}),
        },
        webpush: {
            fcmOptions: {
                link: clickLink,
            },
        },
    });

    const invalidTokens = response.responses
        .map((result, index) => {
            const code = result.error?.code || '';
            return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token'
                ? tokens[index]
                : null;
        })
        .filter((token): token is string => Boolean(token));

    return {
        sent: response.successCount,
        invalidTokens,
    };
};
