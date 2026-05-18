import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Customer } from '../types';
import { MLService } from '../services/mlService';

interface AuthContextType {
  user: FirebaseUser | null;
  customerData: Customer | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshMLToken: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platformConfig, setPlatformConfig] = useState<{ml_app_id: string, ml_app_secret: string} | null>(null);
  const refreshPromise = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    // Fetch platform config
    const fetchPlatformConfig = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'platform'));
        if (configSnap.exists()) {
          const data = configSnap.data();
          setPlatformConfig({
            ml_app_id: data.ml_app_id || '',
            ml_app_secret: data.ml_app_secret || ''
          });
        }
      } catch (error) {
        console.error("Error fetching platform config:", error);
      }
    };
    fetchPlatformConfig();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch or create customer profile in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          let userDoc;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (e: any) {
            console.warn("Primeira tentativa de sincronismo falhou. Tentando novamente...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            userDoc = await getDoc(userDocRef);
          }
          
          if (userDoc.exists()) {
            setCustomerData(userDoc.data() as Customer);
          } else {
            // Create new starter profile
            const newCustomer: Customer = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              plan: 'starter',
              status: 'active',
              mrr: 0,
              total_spent: 0,
              stores_count: 0,
              duplications_count: 0,
              joined_at: new Date().toISOString(),
              last_active: new Date().toISOString(),
            };
            await setDoc(userDocRef, newCustomer);
            setCustomerData(newCustomer);
          }

          // Check for admin status
          const adminDocRef = doc(db, 'admins', firebaseUser.uid);
          let adminDoc;
          try {
            adminDoc = await getDoc(adminDocRef);
          } catch (e) {
            adminDoc = await getDoc(adminDocRef);
          }

          // Bootstrap: Se for o email do dono sid.websp@gmail.com, garante acesso admin mesmo sem doc na coleção admins
          const isBootstrapAdmin = firebaseUser.email === 'sid.websp@gmail.com';
          setIsAdmin(adminDoc.exists() || isBootstrapAdmin);
        } catch (error) {
          console.error("Error syncing user profile:", error);
        }
      } else {
        setCustomerData(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshMLToken = async (): Promise<any> => {
    if (!user || !customerData?.ml_credentials?.refresh_token) {
      console.warn("No user or refresh_token to refresh ML token");
      return null;
    }

    // Ensure platform config is available
    let currentConfig = platformConfig;
    if (!currentConfig) {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'platform'));
        if (configSnap.exists()) {
          const data = configSnap.data();
          currentConfig = {
            ml_app_id: data.ml_app_id || '',
            ml_app_secret: data.ml_app_secret || ''
          };
          setPlatformConfig(currentConfig);
        }
      } catch (e) {
        console.error("Critical error: Failed to fetch platform config during token refresh", e);
      }
    }

    if (!currentConfig || !currentConfig.ml_app_id) {
       console.error("Cannot refresh token: ML platform configuration is missing.");
       return null;
    }

    // If a refresh is already in progress, wait for it
    if (refreshPromise.current) {
      console.log("Token refresh already in progress, waiting for existing promise...");
      return refreshPromise.current;
    }

    refreshPromise.current = (async () => {
      try {
        console.log("Attempting ML token refresh...");
        const { ml_app_id, ml_app_secret } = currentConfig!;
        
        // Add a tiny delay to help with potential race conditions or slight rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

        const newTokens = await MLService.refreshToken(
          customerData.ml_credentials!.refresh_token,
          ml_app_id,
          ml_app_secret
        );

        if (!newTokens || !newTokens.access_token) {
          throw new Error("Invalid token response from ML");
        }

        const expiresAt = Date.now() + (newTokens.expires_in * 1000);
        
        const updatedCredentials = {
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          user_id: newTokens.user_id,
          expires_at: expiresAt
        };

        console.log("ML token refreshed successfully. User ID:", updatedCredentials.user_id);

        // Update Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          ml_credentials: updatedCredentials
        });

        // Update local state - this will trigger re-renders
        setCustomerData(prev => prev ? {
          ...prev,
          ml_credentials: updatedCredentials
        } : null);

        return updatedCredentials;
      } catch (error: any) {
        const status = error.response?.status;
        const details = error.response?.data;
        console.error(`Failed to refresh ML token (Status: ${status}):`, details || error.message);
        
        // If refresh token is invalid (400) or Forbidden/Blocked (403), we might need to notify user
        if (status === 400 || status === 401 || status === 403) {
           console.error("Refresh token might be revoked or expired. Re-authentication required.");
        }
        
        return null;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  };

  return (
    <AuthContext.Provider value={{ user, customerData, isAdmin, loading, signInWithGoogle, logout, refreshMLToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
