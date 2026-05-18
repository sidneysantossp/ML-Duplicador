import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore instead of getFirestore to force longPolling
// This fixes connectivity issues in restricted/sandboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // Using the custom database ID if it exists in config
}, (firebaseConfig as any).firestoreDatabaseId);

export const auth = getAuth(app);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operation: FirestoreErrorInfo['operationType'], path?: string): never {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email || '',
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || ''
    }))
  } : {
    userId: 'none',
    email: '',
    emailVerified: false,
    isAnonymous: true,
    providerInfo: []
  };

  const errorDetail: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore Error',
    operationType: operation,
    path: path || null,
    authInfo
  };

  throw new Error(JSON.stringify(errorDetail));
}

// Connection test
async function testConnection() {
  try {
    // Short delay to ensure Firebase is initialized
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (firebaseConfig.apiKey.startsWith('REPLACE')) return;
    
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
  } catch (error: any) {
    if (error.message?.includes('the client is offline') || error.code === 'unavailable') {
      console.warn("Firebase check: Offline or project not fully provisioned yet.");
    }
  }
}

testConnection();
