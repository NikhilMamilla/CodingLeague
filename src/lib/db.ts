/**
 * Central data access layer — all app code imports from here.
 * Backend: Supabase Postgres. Auth: Firebase (unchanged).
 */
import { supabase } from './supabase';
import type { Participant, Contest, ContestResult, Certificate, Announcement, Sponsor } from '../types';

// ── Row → App type converters ─────────────────────────────────────────────────

export function rowToParticipant(r: any): Participant & { hackerrankUrl?: string; codechefUrl?: string; leetcodeUrl?: string; codeforcesUrl?: string; gfgUrl?: string } {
  return {
    uid: r.uid,
    participantId: r.participant_id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    college: r.college,
    university: r.university,
    year: r.year,
    branch: r.branch,
    city: r.city,
    state: r.state,
    codeforcesHandle: r.codeforces_handle,
    leetcodeUsername: r.leetcode_username,
    codechefUsername: r.codechef_username,
    hackerrankUsername: r.hackerrank_username,
    gfgUsername: r.gfg_username,
    hackerrankUrl: r.hackerrank_url,
    codechefUrl: r.codechef_url,
    leetcodeUrl: r.leetcode_url,
    codeforcesUrl: r.codeforces_url,
    gfgUrl: r.gfg_url,
    github: r.github,
    linkedin: r.linkedin,
    photoURL: r.photo_url,
    bio: r.bio,
    rating: r.rating ?? 800,
    peakRating: r.peak_rating,
    peakTitle: r.peak_title,
    streak: r.streak ?? 0,
    lastContestDate: r.last_contest_date,
    ratingHistory: r.rating_history ?? [],
    tier: r.tier ?? 'Beginner',
    role: r.role ?? 'participant',
    badges: r.badges ?? [],
    contestsParticipated: r.contests_participated ?? 0,
    attendance: r.attendance ?? 0,
    monthlyPoints: r.monthly_points ?? 0,
    createdAt: r.created_at,
    emailVerified: r.email_verified ?? false,
    foundingMember: r.founding_member ?? false,
    foundingRank: r.founding_rank,
    foundingAwardedAt: r.founding_awarded_at,
    foundingSeasonId: r.founding_season_id,
  };
}

export function rowToContest(r: any): Contest {
  return {
    id: r.id,
    contestNumber: r.contest_number,
    name: r.name,
    weekNumber: r.week_number,
    mode: r.mode,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    duration: r.duration,
    platform: r.platform,
    contestLink: r.contest_link,
    venue: r.venue,
    problemSetter: r.problem_setter,
    instructions: r.instructions,
    status: r.status,
    seasonId: r.season_id,
    difficulty: r.difficulty,
    ratingCalculated: r.rating_calculated,
    resultsPublished: r.results_published,
    lockedAt: r.locked_at,
    createdAt: r.created_at,
  };
}

export function rowToResult(r: any): ContestResult {
  return {
    id: r.id,
    contestId: r.contest_id,
    participantId: r.participant_id,
    participantName: r.participant_name,
    college: r.college,
    rank: r.rank,
    score: r.score,
    penalty: r.penalty,
    problemsSolved: r.problems_solved,
    leaguePoints: r.league_points,
    ratingBefore: r.rating_before,
    ratingAfter: r.rating_after,
    ratingChange: r.rating_change,
    // extra fields beyond base type
    ...(r.contest_name  != null && { contestName:  r.contest_name  }),
    ...(r.imported_at   != null && { importedAt:   r.imported_at   }),
  } as any;
}

export function rowToCertificate(r: any): Certificate {
  return {
    id: r.id,
    certificateId: r.certificate_id,
    participantId: r.participant_id,
    participantName: r.participant_name,
    email: r.email,
    certificateType: r.certificate_type,
    contestName: r.contest_name,
    season: r.season,
    position: r.position,
    issuedDate: r.issued_date,
    cloudinaryUrl: r.cloudinary_url,
    cloudinaryPublicId: r.cloudinary_public_id,
    status: r.status,
    issuedBy: r.issued_by,
    templateId: r.template_id,
    createdAt: r.created_at,
    verificationCode: r.verification_code,
  };
}

export function rowToAnnouncement(r: any): Announcement & { id: string } {
  return { id: r.id, title: r.title, body: r.body, category: r.category, createdBy: r.created_by, createdAt: r.created_at, attachments: r.attachments ?? [] };
}

export function rowToSponsor(r: any): Sponsor {
  return { id: r.id, name: r.name, tier: r.tier, logoURL: r.logo_url, websiteURL: r.website_url, isActive: r.is_active };
}

// ── Participants ──────────────────────────────────────────────────────────────

export async function getParticipantByUid(uid: string): Promise<Participant | null> {
  const { data, error } = await supabase.from('participants').select('*').eq('uid', uid).single();
  if (error || !data) return null;
  return rowToParticipant(data);
}

// ── Module-level cache for getParticipants (admin use) ───────────────────────
// Keyed by limit, 30-second TTL. Admin-only callers don't need long freshness.
const _participantsCache     = new Map<number, { data: Participant[]; time: number }>();
const _participantsPromises  = new Map<number, Promise<Participant[]>>();

export async function getParticipants(limit = 0): Promise<Participant[]> {
  const now    = Date.now();
  const cached = _participantsCache.get(limit);
  if (cached && now - cached.time < 30_000) return cached.data;

  const inflight = _participantsPromises.get(limit);
  if (inflight) return inflight;

  const promise = (async () => {
    // Explicit column list — union of all fields consumed across callers:
    //   ImportResults: uid, participant_id, full_name, college, rating, streak,
    //                  contests_participated, monthly_points, peak_rating,
    //                  rating_history, badges, codeforces_handle, leetcode_username,
    //                  codechef_username, hackerrank_username, gfg_username
    //   FoundingMembersAdmin: + email, phone, branch, year, photo_url, role,
    //                           founding_member, founding_rank, founding_awarded_at,
    //                           founding_season_id, created_at
    //   FoundingMemberSettings: (subset of above)
    //   ManageBadges: (subset of above)
    // Excluded (never accessed): bio, github, linkedin, city, state, university,
    //   email_verified, peak_title, last_contest_date, attendance, tier,
    //   *_url (profile URL variants — only needed on public Profile page)
    const cols = [
      'uid', 'participant_id', 'full_name', 'email', 'phone',
      'photo_url', 'role', 'college', 'branch', 'year',
      'rating', 'peak_rating', 'streak', 'monthly_points',
      'contests_participated', 'badges', 'rating_history',
      'founding_member', 'founding_rank', 'founding_awarded_at',
      'founding_season_id', 'created_at',
      'codeforces_handle', 'leetcode_username', 'codechef_username',
      'hackerrank_username', 'gfg_username',
    ].join(', ');

    let query = supabase.from('participants').select(cols)
      .order('monthly_points', { ascending: false })
      .order('rating',         { ascending: false });
    if (limit > 0) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const result = (data ?? []).map(rowToParticipant);
    _participantsCache.set(limit, { data: result, time: Date.now() });
    return result;
  })();

  _participantsPromises.set(limit, promise);
  try {
    return await promise;
  } catch (err) {
    // Remove failed cache entry so a later call can retry
    _participantsCache.delete(limit);
    throw err;
  } finally {
    _participantsPromises.delete(limit);
  }
}

/** Invalidate the getParticipants cache. Call after any write that mutates participant rows. */
export function invalidateParticipantsCache(limit?: number): void {
  if (limit !== undefined) {
    _participantsCache.delete(limit);
    _participantsPromises.delete(limit);
  } else {
    _participantsCache.clear();
    _participantsPromises.clear();
  }
}

// ── Module-level cache for getBasicParticipants ───────────────────────────────
// Shared across ALL callers in the same JS module instance.
// _basicParticipantsPromise deduplicates concurrent calls that arrive before
// the first request completes — they all await the same Promise.
let _basicParticipantsCache:     Participant[] | null = null;
let _basicParticipantsCacheTime: number              = 0;
let _basicParticipantsPromise:   Promise<Participant[]> | null = null;

export async function getBasicParticipants(): Promise<Participant[]> {
  const now = Date.now();

  // ── 1. Serve from cache if still fresh (60s) ──────────────────────────────
  if (_basicParticipantsCache && now - _basicParticipantsCacheTime < 60_000) {
    return _basicParticipantsCache;
  }

  // ── 2. Deduplicate concurrent calls — share the in-flight promise ─────────
  if (_basicParticipantsPromise) {
    return _basicParticipantsPromise;
  }

  // ── 3. Start the actual network request ───────────────────────────────────
  _basicParticipantsPromise = (async () => {
    const columns = 'uid, participant_id, full_name, email, college, branch, year, rating, tier, role, badges, attendance, monthly_points, founding_member, contests_participated';
    const { data, error } = await supabase.from('participants').select(columns)
      .order('monthly_points', { ascending: false })
      .order('rating',         { ascending: false });
    if (error) throw new Error(error.message);
    const result = (data ?? []).map(rowToParticipant);
    // Store in cache
    _basicParticipantsCache     = result;
    _basicParticipantsCacheTime = Date.now();
    return result;
  })();

  try {
    return await _basicParticipantsPromise;
  } finally {
    // Clear in-flight promise so the next call after cache expiry starts fresh
    _basicParticipantsPromise = null;
  }
}

export async function getParticipantsLatestFirst(limit = 10000): Promise<Participant[]> {
  const cols = 'uid, participant_id, full_name, email, college, branch, year, tier, rating, contests_participated, badges, role';
  let query = supabase.from('participants').select(cols).order('participant_id', { ascending: false });
  if (limit > 0) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToParticipant);
}

let _foundingMembersCache:     Participant[] | null = null;
let _foundingMembersCacheTime: number              = 0;
let _foundingMembersPromise:   Promise<Participant[]> | null = null;

export async function getFoundingMembers(): Promise<Participant[]> {
  const now = Date.now();
  if (_foundingMembersCache && now - _foundingMembersCacheTime < 60_000) return _foundingMembersCache;
  if (_foundingMembersPromise) return _foundingMembersPromise;

  _foundingMembersPromise = (async () => {
    // Columns consumed by FoundingMembers.tsx (the only caller):
    //   uid              — React key
    //   participant_id   — display + search + profile link
    //   full_name        — display + avatar initial + search
    //   college          — display + search
    //   photo_url        — avatar image
    //   founding_rank    — rank badge
    //   founding_season_id — header subtitle
    //   created_at       — join date display
    const cols = 'uid, participant_id, full_name, college, photo_url, founding_rank, founding_season_id, created_at';
    const { data } = await supabase
      .from('participants')
      .select(cols)
      .eq('founding_member', true)
      .order('founding_rank', { ascending: true });
    const result = (data ?? []).map(rowToParticipant);
    _foundingMembersCache     = result;
    _foundingMembersCacheTime = Date.now();
    return result;
  })();

  try {
    return await _foundingMembersPromise;
  } finally {
    _foundingMembersPromise = null;
  }
}

export async function upsertParticipant(p: Partial<Participant> & { uid: string }): Promise<void> {
  const row: any = { uid: p.uid };
  if (p.participantId      !== undefined) row.participant_id        = p.participantId;
  if (p.fullName           !== undefined) row.full_name             = p.fullName;
  if (p.email              !== undefined) row.email                 = p.email;
  if (p.phone              !== undefined) row.phone                 = p.phone;
  if (p.college            !== undefined) row.college               = p.college;
  if (p.university         !== undefined) row.university            = p.university;
  if (p.year               !== undefined) row.year                  = p.year;
  if (p.branch             !== undefined) row.branch                = p.branch;
  if (p.city               !== undefined) row.city                  = p.city;
  if (p.state              !== undefined) row.state                 = p.state;
  if (p.codeforcesHandle   !== undefined) row.codeforces_handle     = p.codeforcesHandle;
  if (p.leetcodeUsername   !== undefined) row.leetcode_username     = p.leetcodeUsername;
  if (p.codechefUsername   !== undefined) row.codechef_username     = p.codechefUsername;
  if (p.hackerrankUsername !== undefined) row.hackerrank_username   = p.hackerrankUsername;
  if (p.gfgUsername        !== undefined) row.gfg_username          = p.gfgUsername;
  if ((p as any).hackerrankUrl  !== undefined) row.hackerrank_url   = (p as any).hackerrankUrl;
  if ((p as any).codechefUrl    !== undefined) row.codechef_url     = (p as any).codechefUrl;
  if ((p as any).leetcodeUrl    !== undefined) row.leetcode_url     = (p as any).leetcodeUrl;
  if ((p as any).codeforcesUrl  !== undefined) row.codeforces_url   = (p as any).codeforcesUrl;
  if ((p as any).gfgUrl         !== undefined) row.gfg_url          = (p as any).gfgUrl;
  if (p.github             !== undefined) row.github                = p.github;
  if (p.linkedin           !== undefined) row.linkedin              = p.linkedin;
  if (p.photoURL           !== undefined) row.photo_url             = p.photoURL;
  if (p.bio                !== undefined) row.bio                   = p.bio;
  if (p.rating             !== undefined) row.rating                = p.rating;
  if (p.peakRating         !== undefined) row.peak_rating           = p.peakRating;
  if (p.peakTitle          !== undefined) row.peak_title            = p.peakTitle;
  if (p.streak             !== undefined) row.streak                = p.streak;
  if (p.lastContestDate    !== undefined) row.last_contest_date     = p.lastContestDate;
  if (p.ratingHistory      !== undefined) row.rating_history        = p.ratingHistory;
  if (p.tier               !== undefined) row.tier                  = p.tier;
  if (p.role               !== undefined) row.role                  = p.role;
  if (p.badges             !== undefined) row.badges                = p.badges;
  if (p.contestsParticipated !== undefined) row.contests_participated = p.contestsParticipated;
  if (p.attendance         !== undefined) row.attendance            = p.attendance;
  if (p.monthlyPoints      !== undefined) row.monthly_points        = p.monthlyPoints;
  if (p.createdAt          !== undefined) row.created_at            = p.createdAt;
  if (p.emailVerified      !== undefined) row.email_verified        = p.emailVerified;
  if (p.foundingMember     !== undefined) row.founding_member       = p.foundingMember;
  if (p.foundingRank       !== undefined) row.founding_rank         = p.foundingRank;
  if (p.foundingAwardedAt  !== undefined) row.founding_awarded_at   = p.foundingAwardedAt;
  if (p.foundingSeasonId   !== undefined) row.founding_season_id    = p.foundingSeasonId;
  await supabase.from('participants').upsert(row, { onConflict: 'uid' });
}

export async function deleteParticipant(uid: string): Promise<void> {
  const { error } = await supabase.from('participants').delete().eq('uid', uid);
  if (error) throw new Error(error.message);
}

export async function updateParticipant(uid: string, updates: Record<string, any>): Promise<void> {
  const { error } = await supabase.from('participants').update(updates).eq('uid', uid);
  if (error) throw new Error(error.message);
}

// ── Contests ──────────────────────────────────────────────────────────────────

let _contestsCache:     Contest[] | null = null;
let _contestsCacheTime: number          = 0;
let _contestsPromise:   Promise<Contest[]> | null = null;

export async function getContests(): Promise<Contest[]> {
  const now = Date.now();
  if (_contestsCache && now - _contestsCacheTime < 60_000) return _contestsCache;
  if (_contestsPromise) return _contestsPromise;

  _contestsPromise = (async () => {
    const { data, error } = await supabase
      .from('contests')
      .select('id, contest_number, name, week_number, mode, date, start_time, end_time, duration, platform, contest_link, venue, problem_setter, instructions, status, season_id, difficulty, rating_calculated, results_published, locked_at, created_at')
      .order('date', { ascending: true });
    if (error) throw new Error(error.message);
    const result = (data ?? []).map(rowToContest);
    _contestsCache     = result;
    _contestsCacheTime = Date.now();
    return result;
  })();

  try {
    return await _contestsPromise;
  } finally {
    _contestsPromise = null;
  }
}

/** Invalidate contests cache (call after insert/update/delete). */
export function invalidateContestsCache(): void {
  _contestsCache     = null;
  _contestsCacheTime = 0;
}

export async function getContestById(id: string): Promise<Contest | null> {
  const { data } = await supabase.from('contests').select('*').eq('id', id).single();
  return data ? rowToContest(data) : null;
}

export async function insertContest(c: Omit<Contest, 'id'> & { id?: string }): Promise<string> {
  const row: any = {
    contest_number: c.contestNumber, name: c.name, week_number: c.weekNumber,
    mode: c.mode, date: c.date, start_time: c.startTime, end_time: c.endTime,
    duration: c.duration, platform: c.platform ?? null, contest_link: c.contestLink ?? null,
    venue: c.venue ?? null, problem_setter: c.problemSetter ?? null,
    instructions: c.instructions ?? null, status: c.status, season_id: c.seasonId,
    difficulty: c.difficulty ?? 'Easy', created_at: new Date().toISOString(),
  };
  if (c.id) row.id = c.id;
  const { data, error } = await supabase.from('contests').insert(row).select('id').single();
  if (error) throw new Error(error.message);
  return data?.id ?? '';
}

export async function updateContest(id: string, updates: Partial<Contest>): Promise<void> {
  const row: any = {};
  if (updates.name        !== undefined) row.name          = updates.name;
  if (updates.status      !== undefined) row.status        = updates.status;
  if (updates.contestLink !== undefined) row.contest_link  = updates.contestLink;
  if (updates.platform    !== undefined) row.platform      = updates.platform;
  if (updates.venue       !== undefined) row.venue         = updates.venue;
  if (updates.startTime   !== undefined) row.start_time    = updates.startTime;
  if (updates.endTime     !== undefined) row.end_time      = updates.endTime;
  if (updates.duration    !== undefined) row.duration      = updates.duration;
  if (updates.date        !== undefined) row.date          = updates.date;
  if (updates.weekNumber  !== undefined) row.week_number   = updates.weekNumber;
  if (updates.mode        !== undefined) row.mode          = updates.mode;
  if (updates.difficulty  !== undefined) row.difficulty    = updates.difficulty;
  if (updates.problemSetter !== undefined) row.problem_setter = updates.problemSetter;
  if (updates.instructions  !== undefined) row.instructions  = updates.instructions;
  if ((updates as any).ratingCalculated !== undefined) row.rating_calculated = (updates as any).ratingCalculated;
  if ((updates as any).resultsPublished !== undefined) row.results_published = (updates as any).resultsPublished;
  if ((updates as any).lockedAt !== undefined) row.locked_at = (updates as any).lockedAt;
  const { error } = await supabase.from('contests').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteContest(id: string): Promise<void> {
  const { error } = await supabase.from('contests').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Contest Results ───────────────────────────────────────────────────────────

// Cache for getResultsByParticipant — keyed by participantId.
// 60s TTL; invalidated by invalidateParticipantResultsCache() after imports.
const _participantResultsCache     = new Map<string, { data: ContestResult[]; time: number }>();
const _participantResultsPromises  = new Map<string, Promise<ContestResult[]>>();

export async function getResultsByParticipant(participantId: string): Promise<ContestResult[]> {
  const now    = Date.now();
  const cached = _participantResultsCache.get(participantId);
  if (cached && now - cached.time < 60_000) return cached.data;

  const inflight = _participantResultsPromises.get(participantId);
  if (inflight) return inflight;

  const promise = (async () => {
    // Columns consumed by Dashboard, CWCLGuide, MyStats, and LoginNotifications:
    //   id, contest_id, contest_name — identity / display
    //   rank, score, league_points   — stats, charts, badge evaluation
    //   rating_before, rating_after  — rating delta display and charts
    //   problems_solved              — MyStats charts
    //   imported_at                  — sort order
    const cols = 'id, contest_id, contest_name, participant_id, rank, score, penalty, problems_solved, league_points, rating_before, rating_after, rating_change, imported_at';
    const { data } = await supabase
      .from('contest_results')
      .select(cols)
      .eq('participant_id', participantId)
      .order('imported_at', { ascending: false });
    const result = (data ?? []).map(rowToResult);
    _participantResultsCache.set(participantId, { data: result, time: Date.now() });
    return result;
  })();

  _participantResultsPromises.set(participantId, promise);
  try {
    return await promise;
  } finally {
    _participantResultsPromises.delete(participantId);
  }
}

/** Call after inserting new results for a participant so cache doesn't serve stale data. */
export function invalidateParticipantResultsCache(participantId?: string): void {
  if (participantId) {
    _participantResultsCache.delete(participantId);
  } else {
    _participantResultsCache.clear();
  }
}

const _contestResultsCache     = new Map<string, { data: ContestResult[]; time: number }>();
const _contestResultsPromises  = new Map<string, Promise<ContestResult[]>>();

export async function getResultsByContest(contestId: string): Promise<ContestResult[]> {
  const now    = Date.now();
  const cached = _contestResultsCache.get(contestId);
  if (cached && now - cached.time < 120_000) return cached.data; // 2-min cache

  const inflight = _contestResultsPromises.get(contestId);
  if (inflight) return inflight;

  const promise = (async () => {
    const { data } = await supabase
      .from('contest_results')
      .select('id, contest_id, contest_name, participant_id, participant_name, college, rank, score, penalty, problems_solved, league_points, rating_before, rating_after, rating_change, imported_at')
      .eq('contest_id', contestId);
    const result = (data ?? []).map(rowToResult);
    _contestResultsCache.set(contestId, { data: result, time: Date.now() });
    return result;
  })();

  _contestResultsPromises.set(contestId, promise);
  try {
    return await promise;
  } finally {
    _contestResultsPromises.delete(contestId);
  }
}

export async function getAllResults(): Promise<ContestResult[]> {
  const { data } = await supabase.from('contest_results').select('*');
  return (data ?? []).map(rowToResult);
}

let _contestCountsCache:     Record<string, number> | null = null;
let _contestCountsCacheTime: number                       = 0;
let _contestCountsPromise:   Promise<Record<string, number>> | null = null;

export async function getContestCounts(): Promise<Record<string, number>> {
  const now = Date.now();
  if (_contestCountsCache && now - _contestCountsCacheTime < 60_000) return _contestCountsCache;
  if (_contestCountsPromise) return _contestCountsPromise;

  _contestCountsPromise = (async () => {
    const { data, error } = await supabase.rpc('get_participant_contest_counts');
    if (error) return {};
    const map: Record<string, number> = {};
    (data ?? []).forEach((r: any) => {
      if (r.participant_id) map[r.participant_id.trim()] = Number(r.count);
    });
    _contestCountsCache     = map;
    _contestCountsCacheTime = Date.now();
    return map;
  })();

  try {
    return await _contestCountsPromise;
  } finally {
    _contestCountsPromise = null;
  }
}

export async function insertResult(r: Omit<ContestResult, 'id'> & { id?: string; importedAt?: string }): Promise<void> {
  const row: any = {
    contest_id: r.contestId, contest_name: (r as any).contestName ?? null,
    participant_id: r.participantId, participant_name: r.participantName,
    college: r.college, rank: r.rank, score: r.score, penalty: r.penalty,
    problems_solved: r.problemsSolved, league_points: r.leaguePoints,
    rating_before: r.ratingBefore, rating_after: r.ratingAfter,
    rating_change: r.ratingChange ?? null,
    imported_at: r.importedAt ?? new Date().toISOString(),
  };
  if (r.id) row.id = r.id;
  const { error } = await supabase.from('contest_results').insert(row);
  if (error) throw new Error(error.message);
}

// ── Certificates ──────────────────────────────────────────────────────────────

export async function getCertificates(): Promise<Certificate[]> {
  const { data } = await supabase.from('certificates').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(rowToCertificate);
}

export async function getCertificatesByParticipant(participantId: string): Promise<Certificate[]> {
  const { data } = await supabase
    .from('certificates')
    .select('id, certificate_id, participant_id, participant_name, certificate_type, contest_name, season, position, issued_date, cloudinary_url, status, created_at, verification_code')
    .eq('participant_id', participantId);
  return (data ?? []).map(rowToCertificate);
}

export async function getCertificateByCode(code: string): Promise<Certificate | null> {
  const cols = 'id, certificate_id, participant_id, participant_name, email, certificate_type, contest_name, season, position, issued_date, issued_by, cloudinary_url, verification_code, status';
  const { data: d1 } = await supabase.from('certificates').select(cols).eq('certificate_id', code).maybeSingle();
  if (d1) return rowToCertificate(d1);
  const { data: d2 } = await supabase.from('certificates').select(cols).eq('verification_code', code).maybeSingle();
  if (d2) return rowToCertificate(d2);
  const { data: d3 } = await supabase.from('certificates').select(cols).eq('id', code).maybeSingle();
  return d3 ? rowToCertificate(d3) : null;
}

export async function upsertCertificate(c: Partial<Certificate> & { id: string }): Promise<void> {
  const row: any = {
    id: c.id,
    certificate_id: c.certificateId ?? null,
    participant_id: c.participantId ?? null,
    participant_name: c.participantName ?? null,
    email: c.email ?? null,
    certificate_type: c.certificateType ?? null,
    contest_name: c.contestName ?? null,
    season: c.season ?? null,
    position: c.position ?? null,
    issued_date: c.issuedDate ?? null,
    cloudinary_url: c.cloudinaryUrl ?? null,
    cloudinary_public_id: c.cloudinaryPublicId ?? null,
    status: c.status ?? 'Issued',
    issued_by: c.issuedBy ?? null,
    template_id: c.templateId ?? null,
    created_at: c.createdAt ?? new Date().toISOString(),
    verification_code: c.verificationCode ?? null,
  };
  await supabase.from('certificates').upsert(row, { onConflict: 'id' });
}

export async function deleteCertificate(id: string): Promise<void> {
  await supabase.from('certificates').delete().eq('id', id);
}

// ── Announcements ─────────────────────────────────────────────────────────────

// Cache keyed by limit so getAnnouncements(4) and getAnnouncements(100)
// are stored independently but each deduplicated across concurrent callers.
const _announcementsCache     = new Map<number, { data: (Announcement & { id: string })[]; time: number }>();
const _announcementsPromises  = new Map<number, Promise<(Announcement & { id: string })[]>>();

export async function getAnnouncements(limit = 20): Promise<(Announcement & { id: string })[]> {
  const now     = Date.now();
  const cached  = _announcementsCache.get(limit);
  if (cached && now - cached.time < 60_000) return cached.data;

  const inflight = _announcementsPromises.get(limit);
  if (inflight) return inflight;

  const promise = (async () => {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, body, category, created_by, created_at, attachments')
      .order('created_at', { ascending: false })
      .limit(limit);
    const result = (data ?? []).map(rowToAnnouncement);
    _announcementsCache.set(limit, { data: result, time: Date.now() });
    return result;
  })();

  _announcementsPromises.set(limit, promise);
  try {
    return await promise;
  } finally {
    _announcementsPromises.delete(limit);
  }
}

export async function insertAnnouncement(a: Omit<Announcement, 'id'>): Promise<string> {
  const { data } = await supabase.from('announcements').insert({
    title: a.title, body: a.body, category: a.category,
    created_by: a.createdBy, created_at: new Date().toISOString(),
    attachments: a.attachments ?? [],
  }).select('id').single();
  return data?.id ?? '';
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await supabase.from('announcements').delete().eq('id', id);
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<any> {
  const { data } = await supabase.from('settings').select('data').eq('key', key).maybeSingle();
  return data?.data ?? null;
}

export async function setSetting(key: string, value: Record<string, any>): Promise<void> {
  await supabase.from('settings').upsert({ key, data: value }, { onConflict: 'key' });
}

// ── Counters ──────────────────────────────────────────────────────────────────

export async function getCounter(id: string): Promise<number> {
  const { data } = await supabase.from('counters').select('value').eq('id', id).maybeSingle();
  return data?.value ?? 0;
}

export async function incrementCounter(id: string): Promise<number> {
  // Read-then-write (Supabase free tier has no stored procedures needed for atomicity at low scale)
  const { data: current } = await supabase.from('counters').select('value').eq('id', id).maybeSingle();
  const next = (current?.value ?? 0) + 1;
  await supabase.from('counters').upsert({ id, value: next }, { onConflict: 'id' });
  return next;
}

export async function setCounter(id: string, value: number): Promise<void> {
  await supabase.from('counters').upsert({ id, value }, { onConflict: 'id' });
}

// ── Sponsors ──────────────────────────────────────────────────────────────────

export async function getSponsors(): Promise<Sponsor[]> {
  const { data } = await supabase.from('sponsors').select('*').eq('is_active', true);
  return (data ?? []).map(rowToSponsor);
}

export async function getAllSponsors(): Promise<Sponsor[]> {
  const { data } = await supabase.from('sponsors').select('*');
  return (data ?? []).map(rowToSponsor);
}

export async function upsertSponsor(s: Partial<Sponsor> & { id?: string }): Promise<void> {
  const row: any = {
    name: s.name, tier: s.tier, logo_url: s.logoURL,
    website_url: s.websiteURL, is_active: s.isActive ?? true,
  };
  if (s.id) row.id = s.id;
  await supabase.from('sponsors').upsert(row, { onConflict: 'id' });
}

// ── Admin Aggregations ────────────────────────────────────────────────────────
export async function getTableCount(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function getActiveParticipantsCount(): Promise<number> {
  const { count, error } = await supabase.from('participants').select('*', { count: 'exact', head: true })
    .neq('role', 'admin')
    .gt('contests_participated', 0);
  if (error) return 0;
  return count ?? 0;
}

export async function getNonAdminParticipantsCount(): Promise<number> {
  const { count, error } = await supabase.from('participants').select('*', { count: 'exact', head: true })
    .neq('role', 'admin');
  if (error) return 0;
  return count ?? 0;
}

export async function getAdminStats(): Promise<{ badges: number, foundingMembers: number }> {
  const { data, error } = await supabase.from('participants').select('badges, founding_member').neq('role', 'admin');
  if (error) return { badges: 0, foundingMembers: 0 };
  let badges = 0;
  let foundingMembers = 0;
  for (const row of (data ?? [])) {
    if (row.badges) badges += row.badges.length;
    if (row.founding_member) foundingMembers += 1;
  }
  return { badges, foundingMembers };
}

export async function getTopParticipants(limit = 5): Promise<Participant[]> {
  const columns = 'uid, participant_id, full_name, college, branch, role';
  const { data, error } = await supabase.from('participants').select(columns).neq('role', 'admin').order('monthly_points', { ascending: false }).order('rating', { ascending: false }).limit(limit);
  if (error) return [];
  return (data ?? []).map(rowToParticipant);
}

export async function updateSponsor(id: string, updates: Partial<Sponsor>): Promise<void> {
  const row: any = {};
  if (updates.name       !== undefined) row.name        = updates.name;
  if (updates.tier       !== undefined) row.tier        = updates.tier;
  if (updates.logoURL    !== undefined) row.logo_url    = updates.logoURL;
  if (updates.websiteURL !== undefined) row.website_url = updates.websiteURL;
  if (updates.isActive   !== undefined) row.is_active   = updates.isActive;
  await supabase.from('sponsors').update(row).eq('id', id);
}

// ── Admin Utility: Fix duplicate IDs ─────────────────────────────────────────

/**
 * Removes the duplicate participant at ID 255 (keeps 254) and
 * renumbers every participant whose numeric ID ≥ 255 down by 1,
 * so the total stays contiguous and ends at 260.
 *
 * participant_id format: "CBB000NNN"  (prefix + zero-padded number)
 */
export async function fixDuplicateAndRenumber(
  duplicateIdToDelete: string,        // e.g. "CBB000255"
  renumberFromNum: number,            // e.g. 255  (>= this get shifted -1)
  prefix: string = 'CBB',
  padLength: number = 6,
): Promise<{ deleted: string; updated: number }> {

  // 1. Delete the duplicate record
  const { error: delErr } = await supabase
    .from('participants')
    .delete()
    .eq('participant_id', duplicateIdToDelete);

  if (delErr) throw new Error(`Delete failed: ${delErr.message}`);

  // 2. Fetch all participants whose numeric ID >= renumberFromNum
  const { data, error: fetchErr } = await supabase
    .from('participants')
    .select('uid, participant_id')
    .order('participant_id', { ascending: true });

  if (fetchErr) throw new Error(`Fetch failed: ${fetchErr.message}`);

  const toUpdate = (data ?? []).filter(row => {
    const raw = row.participant_id as string | null;
    if (!raw) return false;
    const num = parseInt(raw.replace(/\D/g, ''), 10);
    return !isNaN(num) && num >= renumberFromNum;
  });

  // 3. Renumber each one down by 1
  let updated = 0;
  for (const row of toUpdate) {
    const oldNum = parseInt((row.participant_id as string).replace(/\D/g, ''), 10);
    const newNum = oldNum - 1;
    const newId  = `${prefix}${String(newNum).padStart(padLength, '0')}`;
    const { error: upErr } = await supabase
      .from('participants')
      .update({ participant_id: newId })
      .eq('uid', row.uid);
    if (upErr) throw new Error(`Update ${row.participant_id} → ${newId} failed: ${upErr.message}`);
    updated++;
  }

  // 4. Update the counter so new registrations get the right next ID
  await supabase
    .from('counters')
    .upsert({ id: 'participant_id', value: renumberFromNum - 1 + toUpdate.length }, { onConflict: 'id' });

  return { deleted: duplicateIdToDelete, updated };
}

/**
 * Rename a single participant ID and update the counter.
 * Use case: After deduplication, CBB000261 needs to become CBB000260,
 * and counter needs to be set to 260.
 */
export async function renameParticipantId(
  oldId: string,
  newId: string,
  counterValue: number,
): Promise<void> {
  // 1. Update the participant_id
  const { error: updateErr } = await supabase
    .from('participants')
    .update({ participant_id: newId })
    .eq('participant_id', oldId);

  if (updateErr) throw new Error(`Failed to rename ${oldId} → ${newId}: ${updateErr.message}`);

  // 2. Set the counter
  await supabase
    .from('counters')
    .upsert({ id: 'participant_id', value: counterValue }, { onConflict: 'id' });
}

/**
 * Compacts all participant IDs to be sequential 1..N with no gaps.
 * Finds all numeric IDs, sorts them, renumbers to fill gaps.
 * Sets the counter to the new max.
 * ONLY processes IDs that start with the given prefix.
 */
export async function compactParticipantIds(
  prefix: string = 'CBB',
  padLength: number = 6,
): Promise<{ renamed: number; newMax: number }> {
  
  // 1. Fetch all participants
  const { data, error } = await supabase
    .from('participants')
    .select('uid, participant_id')
    .order('participant_id', { ascending: true });

  if (error) throw new Error(`Fetch failed: ${error.message}`);

  // 2. Extract ONLY IDs that start with the prefix, then extract numeric part and sort
  const rows = (data ?? [])
    .map(row => ({
      uid: row.uid,
      oldId: row.participant_id as string,
      num: parseInt((row.participant_id as string || '').replace(/\D/g, ''), 10),
    }))
    .filter(r => r.oldId?.startsWith(prefix) && !isNaN(r.num))  // ONLY CBB IDs
    .sort((a, b) => a.num - b.num);

  // 3. Renumber sequentially starting from 1
  let renamed = 0;
  for (let i = 0; i < rows.length; i++) {
    const newNum = i + 1;
    const newId = `${prefix}${String(newNum).padStart(padLength, '0')}`;
    if (rows[i].oldId !== newId) {
      const { error: upErr } = await supabase
        .from('participants')
        .update({ participant_id: newId })
        .eq('uid', rows[i].uid);
      if (upErr) throw new Error(`Update ${rows[i].oldId} → ${newId} failed: ${upErr.message}`);
      renamed++;
    }
  }

  const newMax = rows.length;

  // 4. Update counter to new max — throw if this fails so caller knows
  const { error: cErr } = await supabase
    .from('counters')
    .upsert({ id: 'participant_id', value: newMax }, { onConflict: 'id' });
  if (cErr) throw new Error(`Counter update failed: ${cErr.message}`);

  return { renamed, newMax };
}
