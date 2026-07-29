/**
 * One-time Firestore → Supabase migration script.
 *
 * Run this ONCE from the browser console or from a temporary admin page.
 * It reads all Firestore collections and inserts them into Supabase.
 *
 * Usage: import { runMigration } from '../lib/migrate'; runMigration();
 */

import { collection, getDocs } from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import { supabase } from './supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────

function ts(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  // Firestore Timestamp
  if (value?.seconds) return new Date(value.seconds * 1000).toISOString();
  return String(value);
}

function num(v: any, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

// ── Collection migrators ──────────────────────────────────────────────────────

async function migrateParticipants(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating participants…');
  const snap = await getDocs(collection(firestoreDb, 'participants'));
  let ok = 0, failed = 0;

  for (const d of snap.docs) {
    const f = d.data();
    const row = {
      uid:                   d.id,
      participant_id:        f.participantId        ?? null,
      full_name:             f.fullName             ?? '',
      email:                 f.email               ?? '',
      phone:                 f.phone               ?? null,
      college:               f.college             ?? null,
      university:            f.university          ?? null,
      year:                  f.year                ?? null,
      branch:                f.branch              ?? null,
      city:                  f.city                ?? null,
      state:                 f.state               ?? null,
      codeforces_handle:     f.codeforcesHandle    ?? null,
      leetcode_username:     f.leetcodeUsername    ?? null,
      codechef_username:     f.codechefUsername    ?? null,
      hackerrank_username:   f.hackerrankUsername  ?? null,
      gfg_username:          f.gfgUsername         ?? null,
      hackerrank_url:        f.hackerrankUrl       ?? null,
      codechef_url:          f.codechefUrl         ?? null,
      leetcode_url:          f.leetcodeUrl         ?? null,
      codeforces_url:        f.codeforcesUrl       ?? null,
      gfg_url:               f.gfgUrl              ?? null,
      github:                f.github              ?? null,
      linkedin:              f.linkedin            ?? null,
      photo_url:             f.photoURL            ?? null,
      bio:                   f.bio                 ?? null,
      rating:                num(f.rating, 800),
      peak_rating:           f.peakRating          ? num(f.peakRating) : null,
      peak_title:            f.peakTitle           ?? null,
      streak:                num(f.streak, 0),
      last_contest_date:     f.lastContestDate     ?? null,
      rating_history:        f.ratingHistory       ?? [],
      tier:                  f.tier                ?? 'Beginner',
      role:                  f.role                ?? 'participant',
      badges:                f.badges              ?? [],
      contests_participated: num(f.contestsParticipated, 0),
      attendance:            num(f.attendance, 0),
      monthly_points:        num(f.monthlyPoints, 0),
      created_at:            ts(f.createdAt),
      email_verified:        f.emailVerified       ?? false,
      founding_member:       f.foundingMember      ?? false,
      founding_rank:         f.foundingRank        ? num(f.foundingRank) : null,
      founding_awarded_at:   f.foundingAwardedAt   ?? null,
      founding_season_id:    f.foundingSeasonId    ?? null,
    };

    const { error } = await supabase.from('participants').upsert(row, { onConflict: 'uid' });
    if (error) { console.error('participants:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ participants: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

async function migrateContests(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating contests…');
  const snap = await getDocs(collection(firestoreDb, 'contests'));
  let ok = 0, failed = 0;

  for (const d of snap.docs) {
    const f = d.data();
    const row = {
      id:                 d.id,
      contest_number:     f.contestNumber    ? num(f.contestNumber) : null,
      name:               f.name             ?? '',
      week_number:        f.weekNumber       ? num(f.weekNumber) : null,
      mode:               f.mode             ?? 'Online',
      date:               f.date             ?? '',
      start_time:         f.startTime        ?? null,
      end_time:           f.endTime          ?? null,
      duration:           num(f.duration, 120),
      platform:           f.platform         ?? null,
      contest_link:       f.contestLink      ?? null,
      venue:              f.venue            ?? null,
      problem_setter:     f.problemSetter    ?? null,
      instructions:       f.instructions     ?? null,
      status:             f.status           ?? 'Upcoming',
      season_id:          f.seasonId         ?? null,
      difficulty:         f.difficulty       ?? 'Easy',
      rating_calculated:  f.ratingCalculated ?? false,
      results_published:  f.resultsPublished ?? false,
      locked_at:          ts(f.lockedAt),
      created_at:         ts(f.createdAt),
    };

    const { error } = await supabase.from('contests').upsert(row, { onConflict: 'id' });
    if (error) { console.error('contests:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ contests: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

async function migrateContestResults(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating contestResults…');
  const snap = await getDocs(collection(firestoreDb, 'contestResults'));
  let ok = 0, failed = 0;

  for (const d of snap.docs) {
    const f = d.data();
    const row = {
      id:               d.id,
      contest_id:       f.contestId       ?? '',
      contest_name:     f.contestName     ?? null,
      participant_id:   f.participantId   ?? null,
      participant_name: f.participantName ?? null,
      college:          f.college         ?? null,
      rank:             f.rank            ? num(f.rank) : null,
      score:            f.score           != null ? num(f.score) : null,
      penalty:          f.penalty         != null ? num(f.penalty) : null,
      problems_solved:  num(f.problemsSolved, 0),
      league_points:    num(f.leaguePoints, 0),
      rating_before:    f.ratingBefore    ? num(f.ratingBefore) : null,
      rating_after:     f.ratingAfter     ? num(f.ratingAfter) : null,
      rating_change:    f.ratingChange    != null ? num(f.ratingChange) : null,
      imported_at:      ts(f.importedAt),
    };

    const { error } = await supabase.from('contest_results').upsert(row, { onConflict: 'id' });
    if (error) { console.error('contestResults:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ contestResults: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

async function migrateCertificates(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating certificates…');
  const snap = await getDocs(collection(firestoreDb, 'certificates'));
  let ok = 0, failed = 0;

  for (const d of snap.docs) {
    const f = d.data();
    const row = {
      id:                    d.id,
      certificate_id:        f.certificateId       ?? null,
      participant_id:        f.participantId       ?? null,
      participant_name:      f.participantName     ?? null,
      email:                 f.email               ?? null,
      certificate_type:      f.certificateType     ?? f.type ?? null,
      contest_name:          f.contestName         ?? null,
      season:                f.season              ?? null,
      position:              f.position            ?? null,
      issued_date:           f.issuedDate          ?? null,
      cloudinary_url:        f.cloudinaryUrl       ?? f.pdfURL ?? null,
      cloudinary_public_id:  f.cloudinaryPublicId  ?? null,
      status:                f.status              ?? 'Issued',
      issued_by:             f.issuedBy            ?? null,
      template_id:           f.templateId          ?? null,
      created_at:            ts(f.createdAt        ?? f.issuedAt),
      verification_code:     f.verificationCode    ?? null,
    };

    const { error } = await supabase.from('certificates').upsert(row, { onConflict: 'id' });
    if (error) { console.error('certificates:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ certificates: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

async function migrateAnnouncements(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating announcements…');
  const snap = await getDocs(collection(firestoreDb, 'announcements'));
  let ok = 0, failed = 0;

  for (const d of snap.docs) {
    const f = d.data();
    const row = {
      id:          d.id,
      title:       f.title      ?? '',
      body:        f.body       ?? null,
      category:    f.category   ?? null,
      created_by:  f.createdBy  ?? null,
      created_at:  ts(f.createdAt),
    };

    const { error } = await supabase.from('announcements').upsert(row, { onConflict: 'id' });
    if (error) { console.error('announcements:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ announcements: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

async function migrateSettings(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating settings…');
  let ok = 0, failed = 0;

  const snap = await getDocs(collection(firestoreDb, 'settings'));
  for (const d of snap.docs) {
    const row = { key: d.id, data: d.data() };
    const { error } = await supabase.from('settings').upsert(row, { onConflict: 'key' });
    if (error) { console.error('settings:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ settings: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

async function migrateCounters(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating counters…');
  const snap = await getDocs(collection(firestoreDb, 'counters'));
  let ok = 0, failed = 0;

  for (const d of snap.docs) {
    const f = d.data();
    const row = { id: d.id, value: num(f.value, 0) };
    const { error } = await supabase.from('counters').upsert(row, { onConflict: 'id' });
    if (error) { console.error('counters:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ counters: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

async function migrateSponsors(): Promise<{ ok: number; failed: number }> {
  console.log('📦 Migrating sponsors…');
  const snap = await getDocs(collection(firestoreDb, 'sponsors'));
  let ok = 0, failed = 0;

  for (const d of snap.docs) {
    const f = d.data();
    const row = {
      id:          d.id,
      name:        f.name       ?? null,
      tier:        f.tier       ?? null,
      logo_url:    f.logoURL    ?? null,
      website_url: f.websiteURL ?? null,
      is_active:   f.isActive   ?? true,
    };
    const { error } = await supabase.from('sponsors').upsert(row, { onConflict: 'id' });
    if (error) { console.error('sponsors:', d.id, error.message); failed++; }
    else ok++;
  }

  console.log(`✅ sponsors: ${ok} ok, ${failed} failed`);
  return { ok, failed };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runMigration() {
  console.log('🚀 Starting Firestore → Supabase migration…');
  console.log('⚠️  This is a one-time operation. Do not run it again.');

  const results = await Promise.allSettled([
    migrateParticipants(),
    migrateContests(),
    migrateContestResults(),
    migrateCertificates(),
    migrateAnnouncements(),
    migrateSettings(),
    migrateCounters(),
    migrateSponsors(),
  ]);

  console.log('\n🎉 Migration complete!');
  results.forEach((r, i) => {
    const names = ['participants', 'contests', 'contestResults', 'certificates', 'announcements', 'settings', 'counters', 'sponsors'];
    if (r.status === 'fulfilled') {
      console.log(`  ${names[i]}: ${r.value.ok} ok, ${r.value.failed} failed`);
    } else {
      console.error(`  ${names[i]}: ERROR —`, r.reason);
    }
  });
}
