import { supabase } from './supabase';
import type { Badge, BadgeType, ContestResult, Participant } from '../types';
import { BADGE_META } from '../types';
import { rowToParticipant, rowToResult } from './db';

const AUTO_CRITERIA: Record<BadgeType, ((results: ContestResult[], p: Participant) => boolean) | null> = {
  streak_starter:   (results) => results.length >= 10,
  first_win:        (results) => results.some(r => r.rank === 1),
  top_10:           (results) => results.some(r => r.rank <= 10),
  perfect_score:    (results) => results.some(r => r.score >= 300),
  six_month_streak: (results) => results.length >= 24,
  monthly_champion: null,
  founding_member:  null,
};

function makeBadge(type: BadgeType): Badge {
  return { type, label: BADGE_META[type].label, emoji: BADGE_META[type].emoji, awardedAt: new Date().toISOString() };
}

function computeNewBadges(results: ContestResult[], participant: Participant): Badge[] {
  const existing = new Set((participant.badges ?? []).map(b => b.type));
  const newBadges: Badge[] = [];
  for (const [type, criterion] of Object.entries(AUTO_CRITERIA) as [BadgeType, typeof AUTO_CRITERIA[BadgeType]][]) {
    if (!criterion || existing.has(type)) continue;
    if (criterion(results, participant)) newBadges.push(makeBadge(type));
  }
  return newBadges;
}

export async function evaluateAndAwardBadges(uid: string): Promise<BadgeType[]> {
  const { data: pRow } = await supabase.from('participants').select('*').eq('uid', uid).single();
  if (!pRow) return [];
  const participant = rowToParticipant(pRow);

  const { data: rRows } = await supabase.from('contest_results').select('*').eq('participant_id', participant.participantId);
  const results = (rRows ?? []).map(rowToResult);

  const newBadges = computeNewBadges(results, participant);
  if (newBadges.length === 0) return [];

  const merged = [...(participant.badges ?? []), ...newBadges];
  await supabase.from('participants').update({ badges: merged }).eq('uid', uid);
  return newBadges.map(b => b.type);
}

export async function awardBadge(uid: string, type: BadgeType): Promise<boolean> {
  const { data: pRow } = await supabase.from('participants').select('*').eq('uid', uid).single();
  if (!pRow) return false;
  const participant = rowToParticipant(pRow);
  if ((participant.badges ?? []).some(b => b.type === type)) return false;
  const merged = [...(participant.badges ?? []), makeBadge(type)];
  await supabase.from('participants').update({ badges: merged }).eq('uid', uid);
  return true;
}

export async function revokeBadge(uid: string, type: BadgeType): Promise<boolean> {
  const { data: pRow } = await supabase.from('participants').select('*').eq('uid', uid).single();
  if (!pRow) return false;
  const participant = rowToParticipant(pRow);
  const filtered = (participant.badges ?? []).filter(b => b.type !== type);
  if (filtered.length === (participant.badges ?? []).length) return false;
  await supabase.from('participants').update({ badges: filtered }).eq('uid', uid);
  return true;
}

export async function evaluateAllParticipants(): Promise<Record<string, BadgeType[]>> {
  const { data } = await supabase.from('participants').select('uid').neq('role', 'admin');
  const summary: Record<string, BadgeType[]> = {};
  for (const p of data ?? []) {
    const awarded = await evaluateAndAwardBadges(p.uid);
    if (awarded.length > 0) summary[p.uid] = awarded;
  }
  return summary;
}
