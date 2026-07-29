import { supabase } from './supabase';
import type { Badge } from '../types';

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

async function loadFoundingSettings(): Promise<FoundingSettings | null> {
  const { data } = await supabase.from('settings').select('data').eq('key', 'foundingMembers').maybeSingle();
  if (!data?.data) return null;
  const d = data.data;
  return {
    enabled: d.enabled === true,
    maxFoundingMembers: Number(d.maxFoundingMembers) || 0,
    seasonId: d.seasonId || '2026-27',
    seasonLabel: d.seasonLabel || d.seasonId || '2026-27',
    cutOffDate: d.cutOffDate,
  };
}

function isAfterCutOff(cutOffDate?: string): boolean {
  if (!cutOffDate) return false;
  return new Date() > new Date(cutOffDate);
}

export async function countExistingFoundingMembers(): Promise<number> {
  const { count } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('founding_member', true);
  return count ?? 0;
}

export async function reserveFoundingRank(): Promise<FoundingReservation | null> {
  const settings = await loadFoundingSettings();
  if (!settings || !settings.enabled) return null;
  if (settings.maxFoundingMembers <= 0) return null;
  if (isAfterCutOff(settings.cutOffDate)) return null;

  // Read counter
  const { data: cRow } = await supabase.from('counters').select('value').eq('id', 'foundingMembers').maybeSingle();
  const current = cRow?.value ?? 0;
  if (current >= settings.maxFoundingMembers) return null;

  const next = current + 1;
  await supabase.from('counters').upsert({ id: 'foundingMembers', value: next }, { onConflict: 'id' });

  return { rank: next, seasonId: settings.seasonId, seasonLabel: settings.seasonLabel || settings.seasonId };
}

export async function assignFoundingMember(uid: string): Promise<FoundingReservation | null> {
  const settings = await loadFoundingSettings();
  if (!settings || !settings.enabled) throw new Error('Founding Member program is not enabled.');
  if (settings.maxFoundingMembers <= 0) throw new Error('No founding member slots are configured.');
  if (isAfterCutOff(settings.cutOffDate)) throw new Error('Founding Member cutoff date has passed.');

  const { data: partRow } = await supabase.from('participants').select('*').eq('uid', uid).single();
  if (!partRow) throw new Error('Participant not found.');
  if (partRow.founding_member === true) {
    return { rank: partRow.founding_rank, seasonId: partRow.founding_season_id, seasonLabel: settings.seasonLabel || settings.seasonId };
  }

  const reservation = await reserveFoundingRank();
  if (!reservation) throw new Error('All founding member slots have been claimed.');

  const awardedAt = new Date().toISOString();
  const badge: Badge = { type: 'founding_member', label: 'Founding Member', emoji: '🏅', awardedAt };
  const existingBadges: Badge[] = Array.isArray(partRow.badges) ? partRow.badges : [];
  const hasBadge = existingBadges.some(b => b.type === 'founding_member');

  await supabase.from('participants').update({
    founding_member: true,
    founding_rank: reservation.rank,
    founding_awarded_at: awardedAt,
    founding_season_id: reservation.seasonId,
    badges: hasBadge ? existingBadges : [...existingBadges, badge],
  }).eq('uid', uid);

  return reservation;
}

export async function syncFoundingCounter(): Promise<number> {
  const actual = await countExistingFoundingMembers();
  await supabase.from('counters').upsert({ id: 'foundingMembers', value: actual }, { onConflict: 'id' });
  return actual;
}

export async function resetAndReassignFoundingMembers(): Promise<{ resetCount: number; assignedCount: number }> {
  const settings = await loadFoundingSettings();
  if (!settings || !settings.enabled) throw new Error('Founding Member program is not enabled.');

  // Strip founding status from all
  const { data: existing } = await supabase.from('participants').select('uid, badges').eq('founding_member', true);
  let resetCount = 0;
  for (const p of existing ?? []) {
    const badges = (p.badges ?? []).filter((b: Badge) => b.type !== 'founding_member');
    await supabase.from('participants').update({
      founding_member: false, founding_rank: null,
      founding_awarded_at: null, founding_season_id: null, badges,
    }).eq('uid', p.uid);
    resetCount++;
  }

  await supabase.from('counters').upsert({ id: 'foundingMembers', value: 0 }, { onConflict: 'id' });

  // Reassign to earliest registered
  const { data: eligible } = await supabase
    .from('participants')
    .select('uid')
    .not('role', 'in', '("admin","super_admin")')
    .order('created_at', { ascending: true })
    .limit(settings.maxFoundingMembers + 50);

  let assignedCount = 0;
  for (const p of (eligible ?? []).slice(0, settings.maxFoundingMembers)) {
    try { await assignFoundingMember(p.uid); assignedCount++; } catch { break; }
  }

  return { resetCount, assignedCount };
}
