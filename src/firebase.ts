import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const metaEnv = (import.meta as any).env || {};

// Firebase configuration with environment variables support and fallback to user's credentials
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyAD3isuPUAs7yiBCuTbBRqh2xvUTQ16MFA",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "estil-5eaac.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "estil-5eaac",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "estil-5eaac.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "132251690860",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:132251690860:web:a7157053420f0a062c7549",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-ZRDZ0C26E2"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore Error Handler as specified in firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on startup
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connected successfully!");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Cloud connection check complete (offline fallback is enabled for seamless offline use).");
    } else {
      console.log("Connection test complete (ignored if test doc doesn't exist):", error);
    }
  }
}
