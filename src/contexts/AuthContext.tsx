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
    // Try cache first for instant load
    const cached = sessionStorage.getItem(`participant_${uid}`);
    if (cached) {
      try {
        const p = JSON.parse(cached) as Participant;
        setParticipant(p);
        setRole(p.role);
      } catch { /* ignore bad cache */ }
    }
    // Always fetch fresh from Supabase — retry up to 3x for new registrations
    // where the row may not be written yet
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 800 * attempt));
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();
      if (error) { setParticipant(null); setRole(null); return; }
      if (data) {
        const p = rowToParticipant(data);
        setParticipant(p);
        setRole(p.role);
        sessionStorage.setItem(`participant_${uid}`, JSON.stringify(p));
        return;
      }
      // data is null — row not yet written, retry
    }
    // After retries, participant still not found — clear state
    setParticipant(null);
    setRole(null);
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
    if (user) sessionStorage.removeItem(`participant_${user.uid}`);
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
