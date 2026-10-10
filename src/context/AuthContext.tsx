import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (name?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsDemo: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user previously logged in as demo
    const savedDemo = localStorage.getItem('smart_billing_demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
        setToken(`demo-token-${parsed.uid}`);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('smart_billing_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Store Owner',
          photoURL: fbUser.photoURL || undefined,
        });
        setToken(idToken);
      } else {
        if (!localStorage.getItem('smart_billing_demo_user')) {
          // Initialize default demo session for immediate preview readiness
          const defaultDemo = {
            uid: 'demo-retail-owner',
            email: 'demo@smartbillingpro.in',
            displayName: 'Retail Store Owner',
          };
          setUser(defaultDemo);
          setToken('demo-token-demo-retail-owner');
          localStorage.setItem('smart_billing_demo_user', JSON.stringify(defaultDemo));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      localStorage.removeItem('smart_billing_demo_user');
      setLoading(true);
      const res = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await res.user.getIdToken();
      setUser({
        uid: res.user.uid,
        email: res.user.email || '',
        displayName: res.user.displayName || 'Store Owner',
        photoURL: res.user.photoURL || undefined,
      });
      setToken(idToken);
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemo = (name = 'Retail Store Owner') => {
    const demoUser = {
      uid: 'demo-retail-owner',
      email: 'demo@smartbillingpro.in',
      displayName: name,
    };
    setUser(demoUser);
    setToken('demo-token-demo-retail-owner');
    localStorage.setItem('smart_billing_demo_user', JSON.stringify(demoUser));
  };

  const signOut = async () => {
    localStorage.removeItem('smart_billing_demo_user');
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.log('Firebase signout');
    }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signInWithGoogle, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
