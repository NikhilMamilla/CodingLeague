// ─── User / Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'participant' | 'admin' | 'super_admin';

export type Tier =
  | 'Beginner'
  | 'Explorer'
  | 'Coder'
  | 'Expert'
  | 'Master'
  | 'Grandmaster';

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
  tier: Tier;
  role: UserRole;
  badges: Badge[];
  contestsParticipated: number;
  attendance: number;          // percentage 0–100
  createdAt: string;           // ISO date string
  emailVerified: boolean;
}

// ─── Contest ──────────────────────────────────────────────────────────────────

export type ContestMode = 'Online' | 'Offline';
export type ContestStatus = 'Upcoming' | 'Active' | 'Completed';

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
  | 'monthly_champion';

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
};

// ─── League Points Table ──────────────────────────────────────────────────────

export const LEAGUE_POINTS_TABLE: Record<number, number> = {
  1: 100, 2: 95, 3: 90, 4: 87, 5: 85,
  6: 83,  7: 81, 8: 79, 9: 77, 10: 75,
};
export const PARTICIPATION_POINTS = 10;

// ─── Rating Tiers ─────────────────────────────────────────────────────────────

export const TIER_THRESHOLDS: { min: number; max: number; tier: Tier }[] = [
  { min: 0,    max: 999,  tier: 'Beginner'    },
  { min: 1000, max: 1199, tier: 'Explorer'    },
  { min: 1200, max: 1499, tier: 'Coder'       },
  { min: 1500, max: 1799, tier: 'Expert'      },
  { min: 1800, max: 2199, tier: 'Master'      },
  { min: 2200, max: 9999, tier: 'Grandmaster' },
];

export function getTierFromRating(rating: number): Tier {
  for (const t of TIER_THRESHOLDS) {
    if (rating >= t.min && rating <= t.max) return t.tier;
  }
  return 'Beginner';
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
  | 'participation'
  | 'winner'
  | 'monthly_champion'
  | 'annual_champion';

export interface Certificate {
  id: string;
  participantId: string;
  type: CertificateType;
  contestId?: string;
  month?: string;
  seasonId?: string;
  pdfURL: string;
  verificationCode: string;
  issuedAt: string;
}
