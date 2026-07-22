import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Participant, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  participant: Participant | null;
  role: UserRole | null;
  loading: boolean;
  refreshParticipant: () => Promise<void>;
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
    let unsubParticipant: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous participant listener
      if (unsubParticipant) {
        unsubParticipant();
        unsubParticipant = null;
      }

      if (firebaseUser) {
        // Real-time listener on the participant doc — any admin change
        // (badges, rating, tier) instantly reflects in the logged-in user's state
        unsubParticipant = onSnapshot(
          doc(db, 'participants', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as Participant;
              setParticipant(data);
              setRole(data.role);
            } else {
              setParticipant(null);
              setRole(null);
            }
            setLoading(false);
          },
          () => { setLoading(false); }
        );
      } else {
        setParticipant(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubParticipant) unsubParticipant();
    };
  }, []);

  // refreshParticipant is now a no-op since we have real-time sync,
  // but kept for backward compatibility with components that call it
  async function refreshParticipant() {
    // Real-time listener handles updates automatically
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{
      user, participant, role, loading,
      refreshParticipant, signInWithGoogle, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
