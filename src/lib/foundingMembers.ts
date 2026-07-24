/**
 * Founding Member assignment logic.
 *
 * Used by:
 *  - Registration flow (reserve the next rank atomically)
 *  - Admin backfill (assign existing participants manually)
 */

import {
  collection, doc, getDoc, getDocs,
  query, runTransaction, setDoc, updateDoc, deleteDoc, where, arrayUnion,
  deleteField, writeBatch, orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Badge, Participant } from '../types';

export interface FoundingSettings {
  enabled: boolean;
  maxFoundingMembers: number;
  seasonId: string;
  seasonLabel?: string;
  cutOffDate?: string;
}

export interface FoundingReservation {
  rank: number;
  seasonId: string;
  seasonLabel: string;
}

const COUNTER_DOC = 'counters/foundingMembers';
const SETTINGS_DOC = 'settings/foundingMembers';

async function loadFoundingSettings(): Promise<FoundingSettings | null> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    enabled: data.enabled === true,
    maxFoundingMembers: Number(data.maxFoundingMembers) || 0,
    seasonId: data.seasonId || '2026-27',
    seasonLabel: data.seasonLabel || data.seasonId || '2026-27',
    cutOffDate: data.cutOffDate,
  };
}

function isAfterCutOff(cutOffDate?: string): boolean {
  if (!cutOffDate) return false;
  return new Date() > new Date(cutOffDate);
}

/**
 * Count how many participants already have foundingMember == true.
 */
export async function countExistingFoundingMembers(): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'participants'), where('foundingMember', '==', true))
  );
  return snap.size;
}

/**
 * Ensure the atomic counter reflects the real number of existing founding members.
 * Safe to call multiple times — subsequent calls are no-ops if the counter is correct.
 */
export async function syncFoundingCounter(): Promise<number> {
  const counterRef = doc(db, COUNTER_DOC);
  const counterSnap = await getDoc(counterRef);
  const actual = await countExistingFoundingMembers();

  if (!counterSnap.exists()) {
    await setDoc(counterRef, { value: actual });
    return actual;
  }

  const current = Number(counterSnap.data().value ?? 0);
  if (current !== actual) {
    await setDoc(counterRef, { value: actual });
    return actual;
  }
  return current;
}

/**
 * Reserve the next founding-member rank atomically.
 * Returns null if founding members are disabled or slots are full.
 */
export async function reserveFoundingRank(): Promise<FoundingReservation | null> {
  const settings = await loadFoundingSettings();
  if (!settings || !settings.enabled) return null;
  if (settings.maxFoundingMembers <= 0) return null;
  if (isAfterCutOff(settings.cutOffDate)) return null;

  const counterRef = doc(db, COUNTER_DOC);

  // If the counter has never been created (e.g. feature just enabled),
  // seed it from the current count of founding members so the next
  // registration gets the correct rank (e.g. #24 when 23 already exist).
  const counterSnap = await getDoc(counterRef);
  if (!counterSnap.exists()) {
    const actual = await countExistingFoundingMembers();
    await setDoc(counterRef, { value: actual });
  }

  const rank = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current = snap.exists() ? Number(snap.data().value ?? 0) : 0;
    if (current >= settings.maxFoundingMembers) return null;
    const next = current + 1;
    transaction.set(counterRef, { value: next });
    return next;
  });

  if (!rank) return null;

  return {
    rank,
    seasonId: settings.seasonId,
    seasonLabel: settings.seasonLabel || settings.seasonId,
  };
}

/**
 * Assign founding-member status to an existing participant from the admin panel.
 * Returns the awarded rank, or null if no slots are left / feature disabled.
 */
export async function assignFoundingMember(
  participantDocId: string
): Promise<FoundingReservation | null> {
  const settings = await loadFoundingSettings();
  if (!settings || !settings.enabled) {
    throw new Error('Founding Member program is not enabled.');
  }
  if (settings.maxFoundingMembers <= 0) {
    throw new Error('No founding member slots are configured.');
  }
  if (isAfterCutOff(settings.cutOffDate)) {
    throw new Error('Founding Member cutoff date has passed.');
  }

  // Make sure the counter is in sync before assigning.
  await syncFoundingCounter();

  const reservation = await reserveFoundingRank();
  if (!reservation) {
    throw new Error('All founding member slots have been claimed.');
  }

  const partRef = doc(db, 'participants', participantDocId);
  const partSnap = await getDoc(partRef);
  if (!partSnap.exists()) {
    throw new Error('Participant not found.');
  }

  const participant = { uid: partSnap.id, ...partSnap.data() } as Participant;

  // Idempotent: if already a founding member, just return the existing data.
  if (participant.foundingMember === true) {
    return {
      rank: participant.foundingRank ?? reservation.rank,
      seasonId: participant.foundingSeasonId ?? reservation.seasonId,
      seasonLabel: settings.seasonLabel || settings.seasonId,
    };
  }

  const awardedAt = new Date().toISOString();
  const badge: Badge = {
    type: 'founding_member',
    label: 'Founding Member',
    emoji: '🏅',
    awardedAt,
  };

  const existingBadges = participant.badges ?? [];
  const hasBadge = existingBadges.some((b) => b.type === 'founding_member');

  const update: Record<string, any> = {
    foundingMember: true,
    foundingRank: reservation.rank,
    foundingAwardedAt: awardedAt,
    foundingSeasonId: reservation.seasonId,
  };

  if (!hasBadge) {
    update.badges = arrayUnion(badge);
  }

  await updateDoc(partRef, update);

  return {
    rank: reservation.rank,
    seasonId: reservation.seasonId,
    seasonLabel: settings.seasonLabel || settings.seasonId,
  };
}

/**
 * Removes founding-member status from every participant, resets the atomic
 * counter to zero, then reassigns ranks to the earliest registered participants
 * up to `maxFoundingMembers`.
 *
 * Use this when you want to re-run founding-member allocation from scratch.
 */
export async function resetAndReassignFoundingMembers(): Promise<{
  resetCount: number;
  assignedCount: number;
}> {
  const settings = await loadFoundingSettings();
  if (!settings || !settings.enabled) {
    throw new Error('Founding Member program is not enabled.');
  }
  if (settings.maxFoundingMembers <= 0) {
    throw new Error('No founding member slots are configured.');
  }

  // 1. Strip founding status and the founding_member badge from all participants.
  const foundingSnap = await getDocs(
    query(collection(db, 'participants'), where('foundingMember', '==', true))
  );

  const CHUNK = 400;
  let resetCount = 0;
  for (let i = 0; i < foundingSnap.docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    const chunk = foundingSnap.docs.slice(i, i + CHUNK);
    chunk.forEach((d) => {
      const data = d.data();
      const currentBadges: Badge[] = Array.isArray(data.badges) ? data.badges : [];
      batch.update(d.ref, {
        foundingMember: false,
        foundingRank: deleteField(),
        foundingAwardedAt: deleteField(),
        foundingSeasonId: deleteField(),
        badges: currentBadges.filter((b) => b.type !== 'founding_member'),
      });
    });
    await batch.commit();
    resetCount += chunk.length;
  }

  // 2. Reset the atomic counter so rank assignment starts from #1.
  const counterRef = doc(db, COUNTER_DOC);
  try {
    await deleteDoc(counterRef);
  } catch {
    // If delete fails (e.g. doc didn't exist), continue and recreate it.
  }
  await setDoc(counterRef, { value: 0 });

  // 3. Reassign to the earliest registered eligible participants.
  const eligibleSnap = await getDocs(
    query(
      collection(db, 'participants'),
      orderBy('createdAt', 'asc'),
      limit(settings.maxFoundingMembers + 50)
    )
  );
  const eligible = eligibleSnap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as Participant))
    .filter((p) => p.role !== 'admin' && p.role !== 'super_admin')
    .slice(0, settings.maxFoundingMembers);

  let assignedCount = 0;
  for (const p of eligible) {
    try {
      await assignFoundingMember(p.uid);
      assignedCount++;
    } catch (err: any) {
      // Stop gracefully when slots are exhausted; surface other errors.
      if (err.message?.includes('slots have been claimed')) break;
      throw err;
    }
  }

  return { resetCount, assignedCount };
}
