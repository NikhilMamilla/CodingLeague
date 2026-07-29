import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { rowToParticipant } from '../lib/db';
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

  async function fetchParticipant(uid: string) {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();
    if (error || !data) { setParticipant(null); setRole(null); return; }
    const p = rowToParticipant(data);
    setParticipant(p);
    setRole(p.role);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchParticipant(firebaseUser.uid);
      } else {
        setParticipant(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function refreshParticipant() {
    if (user) await fetchParticipant(user.uid);
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, participant, role, loading, refreshParticipant, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
