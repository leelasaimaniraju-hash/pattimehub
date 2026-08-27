import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with robust long polling configuration to avoid WebChannel iframe dropouts
let firestoreInstance: Firestore;
try {
  const settings = {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  };
  const hasCustomDb =
    firebaseConfigData.firestoreDatabaseId &&
    firebaseConfigData.firestoreDatabaseId !== '(default)';

  if (hasCustomDb) {
    firestoreInstance = initializeFirestore(app, settings, firebaseConfigData.firestoreDatabaseId);
  } else {
    firestoreInstance = initializeFirestore(app, settings);
  }
} catch {
  firestoreInstance =
    firebaseConfigData.firestoreDatabaseId &&
    firebaseConfigData.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
      : getFirestore(app);
}

export const db = firestoreInstance;

// Initialize Firebase Analytics if supported in the current environment
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn('Firebase Analytics not supported in this environment:', err);
  });
}

export { analytics };
export default app;
