import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

/**
 * Provides { user, profile, loading, login, logout }.
 * `profile` is the users/{uid} Firestore doc (holds role + status).
 * A blocked or deleted account is signed out immediately, even mid-session.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return undefined; // Firebase not configured — stay signed out
    let unsubProfile = () => {};
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubProfile();
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      unsubProfile = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
          if (!data || data.status !== 'active') {
            setProfile(null);
            signOut(auth);
          } else {
            setProfile(data);
          }
          setLoading(false);
        },
        () => {
          setProfile(null);
          setLoading(false);
          signOut(auth);
        },
      );
    });
    return () => {
      unsubProfile();
      unsubAuth();
    };
  }, []);

  const login = (email, password) => {
    if (!auth)
      return Promise.reject(
        Object.assign(new Error('not-configured'), { code: 'app/not-configured' }),
      );
    return signInWithEmailAndPassword(auth, email, password);
  };
  const logout = () => (auth ? signOut(auth) : Promise.resolve());

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
