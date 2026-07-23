import type { ContestDifficulty, Tier } from '../types';
import { getTierFromRating, getLeaguePointsForRank, TIER_THRESHOLDS } from '../types';

export { TIER_THRESHOLDS };

export interface ParticipantInput {
  rank: number;
  participantId?: string;
  participantName?: string;
  currentRating: number;
  score: number;
  penalty: number;
  solved?: number;
  currentStreak?: number;
}

export interface RatingCalculationResult {
  participantId?: string;
  participantName?: string;
  rank: number;
  score: number;
  penalty: number;
  solved: number;
  previousRating: number;
  newRating: number;
  ratingChange: number;
  newTier: Tier;
  leaguePoints: number;
  breakdown: {
    baseChange: number;
    expectationDelta: number;
    upsetBonus: number;
    consistencyBonus: number;
    difficultyMultiplier: number;
    sizeMultiplier: number;
    unclampedDelta: number;
  };
}

/**
 * Difficulty Multipliers
 */
export const DIFFICULTY_MULTIPLIERS: Record<ContestDifficulty, number> = {
  Easy: 1.0,
  Medium: 1.1,
  Hard: 1.2,
  Special: 1.3,
};

/**
 * Get Contest Size Multiplier
 */
export function getSizeMultiplier(contestSize: number): number {
  if (contestSize <= 30) return 1.0;
  if (contestSize <= 75) return 1.05;
  if (contestSize <= 150) return 1.10;
  if (contestSize <= 300) return 1.15;
  return 1.20;
}

/**
 * CWCL Rating System v1.0 Calculation Engine
 */
export function calculateCWCLRatingChanges(
  participants: ParticipantInput[],
  difficulty: ContestDifficulty = 'Easy'
): RatingCalculationResult[] {
  const total = participants.length;
  if (total === 0) return [];

  const diffMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
  const sizeMultiplier = getSizeMultiplier(total);

  // Field average rating
  const totalRatingSum = participants.reduce((acc, p) => acc + (p.currentRating || 800), 0);
  const avgRating = totalRatingSum / total;

  return participants.map((p) => {
    const currentRating = Math.max(800, p.currentRating || 800);
    const rank = p.rank;
    const percentile = total > 1 ? rank / total : 0.05;

    // 1. Base Rating Change (Performance Zones)
    let baseChange = 5;
    if (rank === 1 || percentile <= 0.05) {
      baseChange = 35; // Outstanding
    } else if (percentile <= 0.15) {
      baseChange = 25; // Excellent
    } else if (percentile <= 0.30) {
      baseChange = 15; // Good
    } else if (percentile <= 0.70) {
      baseChange = 5; // Average
    } else if (percentile <= 0.90) {
      baseChange = -5; // Poor
    } else {
      baseChange = -15; // Very Poor
    }

    // 2. Expected Performance Adjustment
    const ratingDiff = currentRating - avgRating;
    const expectedPercentile = Math.max(0.05, Math.min(0.95, 0.5 - ratingDiff / 1600));
    const actualPercentile = rank / total;
    const expectationDelta = Math.round((expectedPercentile - actualPercentile) * 30);

    // 3. Upset Bonus
    let upsetBonus = 0;
    const defeated = participants.filter((other) => other.rank > rank);
    let maxDiffDefeated = 0;
    for (const d of defeated) {
      const diff = (d.currentRating || 800) - currentRating;
      if (diff > maxDiffDefeated) maxDiffDefeated = diff;
    }
    if (maxDiffDefeated >= 400) upsetBonus = 15;
    else if (maxDiffDefeated >= 200) upsetBonus = 10;
    else if (maxDiffDefeated >= 100) upsetBonus = 5;

    // 4. Consistency Bonus
    const newStreak = (p.currentStreak || 0) + 1;
    let consistencyBonus = 0;
    if (newStreak === 12) consistencyBonus = 15;
    else if (newStreak === 8) consistencyBonus = 10;
    else if (newStreak === 4) consistencyBonus = 5;

    // 5. Multipliers & Clamping [-30, +50]
    const rawDelta =
      (baseChange + expectationDelta + upsetBonus + consistencyBonus) *
      diffMultiplier *
      sizeMultiplier;

    const clampedDelta = Math.max(-30, Math.min(50, Math.round(rawDelta)));

    // Rating Floor at 800
    const newRating = Math.max(800, currentRating + clampedDelta);
    const finalChange = newRating - currentRating;
    const newTier = getTierFromRating(newRating);

    const hasSubmission = (p.solved ?? 0) > 0 || p.score > 0;
    const leaguePoints = getLeaguePointsForRank(rank, hasSubmission);

    return {
      participantId: p.participantId,
      participantName: p.participantName,
      rank,
      score: p.score,
      penalty: p.penalty,
      solved: p.solved ?? 0,
      previousRating: currentRating,
      newRating,
      ratingChange: finalChange,
      newTier,
      leaguePoints,
      breakdown: {
        baseChange,
        expectationDelta,
        upsetBonus,
        consistencyBonus,
        difficultyMultiplier: diffMultiplier,
        sizeMultiplier,
        unclampedDelta: Math.round(rawDelta),
      },
    };
  });
}

/**
 * Styling helper for Tiers
 */
export const TIER_CONFIG: Record<
  Tier,
  { label: string; color: string; bg: string; border: string }
> = {
  Beginner: {
    label: 'Beginner',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
  },
  Explorer: {
    label: 'Explorer',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  Coder: {
    label: 'Coder',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
  Specialist: {
    label: 'Specialist',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  Expert: {
    label: 'Expert',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  'Candidate Master': {
    label: 'Candidate Master',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  Master: {
    label: 'Master',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  Grandmaster: {
    label: 'Grandmaster',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  'Legendary Grandmaster': {
    label: 'Legendary Grandmaster',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
  },
};
