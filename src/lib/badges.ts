/**
 * Badge evaluation & awarding logic.
 *
 * Call `evaluateAndAwardBadges(participantId)` after any contest result is
 * imported.  It reads all results for that participant, determines which
 * badges they've earned, and writes any *new* badges back to Firestore.
 */

import {
  collection, doc, getDoc, getDocs,
  query, where, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Badge, BadgeType, ContestResult, Participant } from '../types';
import { BADGE_META } from '../types';

// ─── Criteria ────────────────────────────────────────────────────────────────

/**
 * Each criterion takes the participant's full result history and the latest
 * participant document and returns `true` if the badge should be awarded.
 *
 * Criteria that are admin-only (monthly_champion) are excluded here — they
 * are awarded manually via `awardBadge()`.
 */
const AUTO_CRITERIA: Record<BadgeType, ((results: ContestResult[], p: Participant) => boolean) | null> = {
  // 🔥  Participated in 10 or more contests
  streak_starter: (results) => results.length >= 10,

  // 🏆  Finished rank #1 in at least one contest
  first_win: (results) => results.some(r => r.rank === 1),

  // ⭐  Finished in the top 10 in at least one contest
  top_10: (results) => results.some(r => r.rank <= 10),

  // 🎯  Achieved a perfect / near-perfect score (≥ 300) in any contest
  perfect_score: (results) => results.some(r => r.score >= 300),

  // 💎  Participated in 24+ contests (roughly 6 months of weekly contests)
  six_month_streak: (results) => results.length >= 24,

  // 👑  Monthly champion — admin-only, never auto-awarded
  monthly_champion: null,
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Build a Badge object for a given type. */
function makeBadge(type: BadgeType): Badge {
  const meta = BADGE_META[type];
  return {
    type,
    label: meta.label,
    emoji: meta.emoji,
    awardedAt: new Date().toISOString(),
  };
}

/**
 * Evaluate auto-criteria for a participant and return any *new* badges
 * (i.e. badges not already in their profile).
 */
function computeNewBadges(results: ContestResult[], participant: Participant): Badge[] {
  const existing = new Set((participant.badges ?? []).map(b => b.type));
  const newBadges: Badge[] = [];

  for (const [type, criterion] of Object.entries(AUTO_CRITERIA) as [BadgeType, typeof AUTO_CRITERIA[BadgeType]][]) {
    if (!criterion) continue;           // admin-only badge — skip
    if (existing.has(type)) continue;   // already earned — skip
    if (criterion(results, participant)) {
      newBadges.push(makeBadge(type));
    }
  }

  return newBadges;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate and award auto-criteria badges for a single participant.
 *
 * @param participantDocId  Firestore document ID (= Firebase Auth UID)
 * @returns  Array of newly awarded badge types, or [] if nothing changed.
 */
export async function evaluateAndAwardBadges(participantDocId: string): Promise<BadgeType[]> {
  // 1. Load participant
  const partRef  = doc(db, 'participants', participantDocId);
  const partSnap = await getDoc(partRef);
  if (!partSnap.exists()) return [];
  const participant = { uid: partSnap.id, ...partSnap.data() } as Participant;

  // 2. Load all contest results for this participant
  const resultsSnap = await getDocs(
    query(
      collection(db, 'contestResults'),
      where('participantId', '==', participant.participantId),
    )
  );
  const results = resultsSnap.docs.map(d => d.data() as ContestResult);

  // 3. Compute new badges
  const newBadges = computeNewBadges(results, participant);
  if (newBadges.length === 0) return [];

  // 4. Write to Firestore using arrayUnion (idempotent for object identity —
  //    we rely on the `existing` Set check above to avoid duplicates)
  await updateDoc(partRef, {
    badges: arrayUnion(...newBadges),
  });

  return newBadges.map(b => b.type);
}

/**
 * Manually award a single badge to a participant.
 * Safe to call multiple times — won't duplicate if the badge type already exists.
 *
 * @param participantDocId  Firestore document ID (= Firebase Auth UID)
 * @param type              The badge type to award
 * @returns  `true` if a new badge was added, `false` if already present.
 */
export async function awardBadge(participantDocId: string, type: BadgeType): Promise<boolean> {
  const partRef  = doc(db, 'participants', participantDocId);
  const partSnap = await getDoc(partRef);
  if (!partSnap.exists()) return false;
  const participant = { uid: partSnap.id, ...partSnap.data() } as Participant;

  const already = (participant.badges ?? []).some(b => b.type === type);
  if (already) return false;

  await updateDoc(partRef, {
    badges: arrayUnion(makeBadge(type)),
  });
  return true;
}

/**
 * Revoke a badge from a participant.
 *
 * @param participantDocId  Firestore document ID
 * @param type              The badge type to remove
 * @returns  `true` if a badge was removed, `false` if it wasn't there.
 */
export async function revokeBadge(participantDocId: string, type: BadgeType): Promise<boolean> {
  const partRef  = doc(db, 'participants', participantDocId);
  const partSnap = await getDoc(partRef);
  if (!partSnap.exists()) return false;
  const participant = { uid: partSnap.id, ...partSnap.data() } as Participant;

  const existing = participant.badges ?? [];
  const filtered = existing.filter(b => b.type !== type);
  if (filtered.length === existing.length) return false;

  await updateDoc(partRef, { badges: filtered });
  return true;
}

/**
 * Run badge evaluation for ALL participants.
 * Useful as a one-time backfill or after bulk imports.
 *
 * @returns  A summary map of participantId → newly awarded badge types.
 */
export async function evaluateAllParticipants(): Promise<Record<string, BadgeType[]>> {
  const partSnap = await getDocs(collection(db, 'participants'));
  const summary: Record<string, BadgeType[]> = {};

  await Promise.all(
    partSnap.docs
      .filter(d => d.data().role !== 'admin')
      .map(async d => {
        const awarded = await evaluateAndAwardBadges(d.id);
        if (awarded.length > 0) {
          summary[d.data().participantId ?? d.id] = awarded;
        }
      })
  );

  return summary;
}
