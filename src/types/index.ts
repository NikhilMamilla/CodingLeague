// ─── User / Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'participant' | 'admin' | 'super_admin';

export type Tier =
  | 'Beginner'
  | 'Explorer'
  | 'Coder'
  | 'Specialist'
  | 'Expert'
  | 'Candidate Master'
  | 'Master'
  | 'Grandmaster'
  | 'Legendary Grandmaster';

export interface RatingHistoryItem {
  contestId: string;
  contestName: string;
  contestDate: string;
  rank: number;
  previousRating: number;
  newRating: number;
  ratingChange: number;
}

export interface Participant {
  uid: string;
  participantId: string;       // e.g. CBB000001
  fullName: string;
  email: string;
  phone: string;
  college: string;
  university: string;
  year: string;
  branch: string;
  city: string;
  state: string;
  codeforcesHandle?: string;   // optional — CF not mandatory
  leetcodeUsername: string;    // mandatory
  codechefUsername: string;    // mandatory
  hackerrankUsername: string;  // mandatory
  gfgUsername?: string;        // optional
  github?: string;
  linkedin?: string;
  photoURL?: string;
  bio?: string;
  rating: number;
  peakRating?: number;
  peakTitle?: Tier;
  streak?: number;
  lastContestDate?: string;
  ratingHistory?: RatingHistoryItem[];
  tier: Tier;
  role: UserRole;
  badges: Badge[];
  contestsParticipated: number;
  attendance: number;          // percentage 0–100
  monthlyPoints?: number;      // optional live monthly LP value
  createdAt: string;           // ISO date string
  emailVerified: boolean;
  // Founding Member Recognition
  foundingMember?: boolean;
  foundingRank?: number;
  foundingAwardedAt?: string;  // ISO date string
  foundingSeasonId?: string;
}

// ─── Contest ──────────────────────────────────────────────────────────────────

export type ContestMode = 'Online' | 'Offline';
export type ContestStatus = 'Upcoming' | 'Active' | 'Completed';
export type ContestDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Special';

export interface Contest {
  id: string;
  contestNumber: number;
  name: string;
  weekNumber: number;
  mode: ContestMode;
  date: string;               // ISO date string
  startTime: string;          // e.g. "10:00"
  endTime: string;            // e.g. "12:00"
  duration: number;           // minutes
  platform?: string;          // e.g. "Codeforces"
  contestLink?: string;       // for Online mode
  venue?: string;             // for Offline mode
  problemSetter?: string;
  instructions?: string;
  status: ContestStatus;
  seasonId: string;
  difficulty?: ContestDifficulty;
  ratingCalculated?: boolean;
  resultsPublished?: boolean;
  lockedAt?: string;
  createdAt: string;
}

// ─── Results / Leaderboard ────────────────────────────────────────────────────

export interface ContestResult {
  id: string;
  contestId: string;
  participantId: string;
  participantName: string;
  college: string;
  rank: number;
  score: number;
  penalty: number;
  problemsSolved: number;
  leaguePoints: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange?: number;
}

export interface MonthlyStanding {
  participantId: string;
  participantName: string;
  college: string;
  month: string;              // e.g. "2026-08"
  seasonId: string;
  totalLeaguePoints: number;
  totalScore: number;
  totalPenalty: number;
  contestsPlayed: number;
  participationPercent: number;
  rank: number;
}

export interface SeasonStanding {
  participantId: string;
  participantName: string;
  college: string;
  seasonId: string;
  rating: number;
  tier: Tier;
  totalLeaguePoints: number;
  wins: number;
  top10Finishes: number;
  attendance: number;
  badges: Badge[];
  rank: number;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeType =
  | 'streak_starter'
  | 'first_win'
  | 'top_10'
  | 'perfect_score'
  | 'six_month_streak'
  | 'monthly_champion'
  | 'founding_member';

export interface Badge {
  type: BadgeType;
  label: string;
  emoji: string;
  awardedAt: string;          // ISO date string
}

export const BADGE_META: Record<BadgeType, { label: string; emoji: string }> = {
  streak_starter:   { label: '10 Contests',      emoji: '🔥' },
  first_win:        { label: 'First Win',         emoji: '🏆' },
  top_10:           { label: 'Top 10',            emoji: '⭐' },
  perfect_score:    { label: 'Perfect Score',     emoji: '🎯' },
  six_month_streak: { label: '6 Month Streak',    emoji: '💎' },
  monthly_champion: { label: 'Monthly Champion',  emoji: '👑' },
  founding_member:  { label: 'Founding Member',   emoji: '🏅' },
};

// ─── League Points Table ──────────────────────────────────────────────────────

export const LEAGUE_POINTS_TABLE: Record<number, number> = {
  1: 100, 2: 95, 3: 90, 4: 87, 5: 84,
  6: 82,  7: 80, 8: 78, 9: 76, 10: 74,
};

export function getLeaguePointsForRank(rank: number, hasSubmission: boolean = true): number {
  if (!hasSubmission) return 0;
  if (rank >= 1 && rank <= 10) return LEAGUE_POINTS_TABLE[rank] ?? 74;
  if (rank >= 11 && rank <= 20) return 60;
  if (rank >= 21 && rank <= 40) return 40;
  if (rank >= 41 && rank <= 60) return 25;
  return 10;
}

export const PARTICIPATION_POINTS = 10;

// ─── Rating Tiers ─────────────────────────────────────────────────────────────

export const TIER_THRESHOLDS: { min: number; max: number; tier: Tier }[] = [
  { min: 800,  max: 899,   tier: 'Beginner'             },
  { min: 900,  max: 999,   tier: 'Explorer'             },
  { min: 1000, max: 1099,  tier: 'Coder'                },
  { min: 1100, max: 1249,  tier: 'Specialist'           },
  { min: 1250, max: 1449,  tier: 'Expert'               },
  { min: 1450, max: 1649,  tier: 'Candidate Master'     },
  { min: 1650, max: 1849,  tier: 'Master'               },
  { min: 1850, max: 2099,  tier: 'Grandmaster'          },
  { min: 2100, max: 99999, tier: 'Legendary Grandmaster' },
];

export function getTierFromRating(rating: number): Tier {
  const r = Math.max(800, rating);
  for (const t of TIER_THRESHOLDS) {
    if (r >= t.min && r <= t.max) return t.tier;
  }
  return r >= 2100 ? 'Legendary Grandmaster' : 'Beginner';
}

// ─── Season ───────────────────────────────────────────────────────────────────

export interface Season {
  id: string;
  name: string;               // e.g. "CWCL 2026–27"
  startDate: string;
  endDate: string;
  isActive: boolean;
  leaguePointsTable?: Record<number, number>;
  prizeAmounts?: { first: number; second: number; third: number };
}

// ─── Sponsor ──────────────────────────────────────────────────────────────────

export type SponsorTier = 'Gold' | 'Silver' | 'Bronze';

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  logoURL: string;
  websiteURL: string;
  isActive: boolean;
}

// ─── Announcement ─────────────────────────────────────────────────────────────

export type AnnouncementCategory =
  | 'Workshop'
  | 'Hackathon'
  | 'Contest'
  | 'Results'
  | 'Recruitment'
  | 'Sponsors';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  createdBy: string;
  createdAt: string;
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export type CertificateType =
  | 'Participation'
  | 'Winner'
  | 'Monthly Champion'
  | 'Founding Member';

export type CertificateStatus = 'Pending' | 'Issued';

export interface Certificate {
  id: string;
  certificateId: string;
  participantId: string;
  participantName: string;
  email: string;
  certificateType: CertificateType | string;
  contestName: string;
  season: string;
  position?: string;
  issuedDate: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  status: CertificateStatus;
  issuedBy: string;
  templateId?: string;
  createdAt?: string;

  // Legacy fallback compatibility
  type?: CertificateType | string;
  pdfURL?: string;
  verificationCode?: string;
  issuedAt?: string;
}
