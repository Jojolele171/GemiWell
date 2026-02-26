
import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

export function initializeFirebase() {
  const apps = getApps();
  
  if (!apps.length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0];
  }

  auth = getAuth(app);
  firestore = getFirestore(app);

  return { app, auth, firestore };
}

// Ensure instances are available for module-level exports
const instances = initializeFirebase();

export const authInstance = instances.auth;
export const firestoreInstance = instances.firestore;

export async function signOutUser() {
  if (!authInstance) return;
  return firebaseSignOut(authInstance);
}
