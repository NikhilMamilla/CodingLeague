import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Participant, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  participant: Participant | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [role,        setRole]        = useState<UserRole | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'participants', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data() as Participant;
          setParticipant(data);
          setRole(data.role);
        }
      } else {
        setParticipant(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, participant, role, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
