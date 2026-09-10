import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// True once real Firebase config values are present. Until then the app
// still renders and works for the current tab, it just can't save
// anything between visits -- see DataProvider's dbReady flag.
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (firebaseReady && typeof window !== "undefined") {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    // Persist to IndexedDB so classes/homework/schedule are readable -- and
    // still editable -- with poor or no connectivity (spotty wifi, cell
    // dead zones, airplane mode). Anything added or changed while offline
    // is queued locally and synced automatically once back online, and
    // survives closing the tab/app in the meantime.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Falls back to the default in-memory cache if persistence can't be set
    // up (e.g. an unsupported browser, or Firestore was already initialized
    // for this app elsewhere -- such as during dev hot-reload).
    db = getFirestore(app);
  }
}

export { app, db };
