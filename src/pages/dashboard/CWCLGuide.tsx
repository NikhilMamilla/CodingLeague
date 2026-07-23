import { useEffect, useState } from 'react';
import {
  Trophy, Calendar, Zap, Shield, Flame,
  CheckCircle, ChevronDown, User, Crown,
  TrendingUp, HelpCircle, Mail
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import CBBLogo from '../../components/ui/CBBLogo';
import { TIER_CONFIG } from '../../lib/ratingEngine';
import type { ContestResult } from '../../types';
import { TIER_THRESHOLDS } from '../../types';

// ─── FAQ Items ──────────────────────────────────────────────────────────────
const GUIDE_FAQS = [
  {
    q: 'How do ratings work in CWCL v1.0?',
    a: 'Every participant starts at 800 Rating (Beginner title). Ratings never reset and cannot drop below 800. Ratings update after every completed contest based on performance zones, expectation deltas, upset bonuses, and difficulty/size multipliers.',
  },
  {
    q: 'How are monthly winners selected?',
    a: 'Monthly winners are selected strictly by cumulative Monthly League Points (LP) earned that month — NOT by Rating. 1st Place gets ₹3000, 2nd Place gets ₹2000, and 3rd Place gets ₹1000.',
  },
  {
    q: 'Can my rating decrease if I perform poorly?',
    a: 'Yes, if you rank in the Poor or Very Poor performance zones, your rating may decrease slightly (clamped to a maximum decrease of -30 per contest). However, your rating can never fall below the 800 Rating floor.',
  },
  {
    q: 'What happens if I miss a contest?',
    a: 'Inactivity does not penalize your Rating. Skipping a contest yields 0 Monthly League Points for that week, but your Rating remains untouched.',
  },
  {
    q: 'Do I need to register for every weekly contest?',
    a: 'No. Registration for CWCL is a one-time process. Once you register and receive your unique CBB Participant ID (e.g. CBB000123), you are eligible for all weekly contests for the entire season.',
  },
  {
    q: 'How do I download my certificates?',
    a: 'Participation and Winner certificates are auto-generated after each contest once admin results are published. You can view and download them directly from your Dashboard -> Certificates page.',
  },
  {
    q: 'Can I join CWCL after the season has already started?',
    a: 'Yes! Students can join at any point during the season. New participants start at 800 Rating and begin accumulating Monthly League Points for the active month.',
  },
];

export default function CWCLGuide() {
  const { participant } = useAuth();
  const [overallRank, setOverallRank] = useState<number | null>(null);
  const [collegeRank, setCollegeRank] = useState<number | null>(null);
  const [bestFinish, setBestFinish] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Real-time Overall & College Rank calculation
  useEffect(() => {
    if (!participant) return;

    // Listen to overall leaderboard for rank
    const qOverall = query(
      collection(db, 'participants'),
      orderBy('rating', 'desc'),
      limit(500)
    );
    const unsubOverall = onSnapshot(qOverall, (snap) => {
      const all = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as any))
        .filter((p) => p.role !== 'admin' && p.role !== 'super_admin');

      const idx = all.findIndex((p) => p.uid === participant.uid);
      setOverallRank(idx !== -1 ? idx + 1 : null);

      // College rank
      const collegeAll = all.filter(
        (p) => p.college?.toLowerCase() === participant.college?.toLowerCase()
      );
      const colIdx = collegeAll.findIndex((p) => p.uid === participant.uid);
      setCollegeRank(colIdx !== -1 ? colIdx + 1 : null);
    });

    // Listen to user results for best finish (client-side min rank calc, no composite index needed)
    const qResults = query(
      collection(db, 'contestResults'),
      where('participantId', '==', participant.participantId),
      limit(100)
    );
    const unsubResults = onSnapshot(qResults, (snap) => {
      const resList = snap.docs.map((d) => d.data() as ContestResult);
      if (resList.length > 0) {
        const ranks = resList.map((r) => r.rank).filter((rk) => typeof rk === 'number' && rk > 0);
        if (ranks.length > 0) {
          setBestFinish(Math.min(...ranks));
        }
      }
    });

    return () => {
      unsubOverall();
      unsubResults();
    };
  }, [participant]);

  // Calculate Next Title Threshold
  const rating = participant?.rating ?? 800;
  const currentTier = participant?.tier ?? 'Beginner';
  const tierCfg = TIER_CONFIG[currentTier] ?? TIER_CONFIG.Beginner;

  const currentThresholdObj = TIER_THRESHOLDS.find((t) => t.tier === currentTier);
  const currentMin = currentThresholdObj ? currentThresholdObj.min : 800;
  const currentMax = currentThresholdObj ? currentThresholdObj.max : 899;

  const nextTierObj = TIER_THRESHOLDS.find((t) => t.min > currentMax);
  const nextTitleName = nextTierObj ? nextTierObj.tier : 'Max Tier Reached';
  const nextTargetRating = nextTierObj ? nextTierObj.min : currentMax;

  const pointsNeeded = Math.max(0, nextTargetRating - rating);
  const progressPct = nextTierObj
    ? Math.min(100, Math.max(0, Math.round(((rating - currentMin) / (nextTargetRating - currentMin)) * 100)))
    : 100;

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 pb-10 sm:pb-14 md:pb-16 max-w-6xl mx-auto px-3 sm:px-4 lg:px-0">
      {/* ══ MY CWCL SNAPSHOT CARD (Personalized Top Section) ══ */}
      {participant && (
        <div className="card-glow border-2 border-neon-cyan/40 bg-gradient-to-br from-midnight via-navy/90 to-card-dark p-4 sm:p-5 md:p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 sm:mb-6 pb-4 sm:pb-6 border-b border-neon-cyan/20 relative z-10">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neon-cyan/10 border-2 border-neon-cyan/40 flex items-center justify-center shrink-0 shadow-lg">
                <CBBLogo size={38} glow />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-heading uppercase tracking-widest text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30 px-2 py-0.5 rounded">
                    My CWCL Snapshot
                  </span>
                </div>
                <h1 className="heading-md text-base sm:text-lg md:text-2xl text-white mt-1 break-words leading-tight">
                  {participant.fullName} <span className="text-text-secondary text-[10px] sm:text-xs font-normal">({participant.participantId})</span>
                </h1>
                <p className="text-text-secondary text-[11px] sm:text-xs">{participant.college}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center">
              <span className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-heading font-bold border ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border}`}>
                {currentTier}
              </span>
            </div>
          </div>

          {/* Snapshot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 relative z-10">
            <div className="bg-midnight/80 border border-neon-cyan/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">Rating</div>
              <div className="stat-number text-lg sm:text-xl text-neon-cyan">{rating}</div>
            </div>

            <div className="bg-midnight/80 border border-gold/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">Peak Rating</div>
              <div className="stat-number text-lg sm:text-xl text-gold">{participant.peakRating ?? rating}</div>
            </div>

            <div className="bg-midnight/80 border border-electric-blue/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">Monthly LP</div>
              <div className="stat-number text-lg sm:text-xl text-electric-blue">+{participant.monthlyPoints ?? 0}</div>
            </div>

            <div className="bg-midnight/80 border border-success/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">Overall Rank</div>
              <div className="stat-number text-lg sm:text-xl text-success">{overallRank ? `#${overallRank}` : '—'}</div>
            </div>

            <div className="bg-midnight/80 border border-purple-500/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">College Rank</div>
              <div className="stat-number text-lg sm:text-xl text-purple-400">{collegeRank ? `#${collegeRank}` : '—'}</div>
            </div>

            <div className="bg-midnight/80 border border-amber-500/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">Contests</div>
              <div className="stat-number text-lg sm:text-xl text-amber-400">{participant.contestsParticipated}</div>
            </div>

            <div className="bg-midnight/80 border border-rose-500/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">Best Finish</div>
              <div className="stat-number text-lg sm:text-xl text-rose-400">{bestFinish ? `#${bestFinish}` : '—'}</div>
            </div>

            <div className="bg-midnight/80 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider mb-1">Streak</div>
              <div className="stat-number text-lg sm:text-xl text-emerald-400">{participant.streak ?? 0} 🔥</div>
            </div>
          </div>

          {/* Progress to Next Title */}
          {nextTierObj && (
            <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-xs mb-1.5">
                <span className="text-text-secondary flex items-center gap-1.5 flex-wrap">
                  <TrendingUp size={13} className="text-neon-cyan shrink-0" />
                  Progress to Next Title: <strong className="text-white">{nextTitleName}</strong>
                </span>
                <span className="font-numbers text-neon-cyan font-bold break-all">
                  {rating} / {nextTargetRating} Rating ({pointsNeeded > 0 ? `+${pointsNeeded} needed` : 'Threshold reached'})
                </span>
              </div>
              <div className="h-2.5 bg-black/50 border border-neon-cyan/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan via-electric-blue to-gold rounded-full transition-all duration-700 shadow-glow"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SECTION 1: WELCOME ══ */}
      <div className="card space-y-4 p-4 sm:p-5 md:p-6 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <CBBLogo size={48} glow={false} />
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 1</div>
            <h2 className="heading-md">Welcome to the CBB Weekly Coding League</h2>
          </div>
        </div>

        <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
          The <strong>CBB Weekly Coding League (CWCL)</strong> is a year-long competitive programming league organized by
          <strong> Coding Brigade BVRIT</strong> in collaboration with <strong>CSI BVRIT</strong>.
        </p>

        <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
          Unlike one-off hackathons or isolated coding contests, CWCL runs as a continuous professional league. Every Saturday,
          participants gather online or offline to solve algorithmic challenges, improve their rating, earn monthly points, and compete
          for cash prizes and Hall of Fame recognition.
        </p>
      </div>

      {/* ══ SECTION 2: LEAGUE STRUCTURE & TIMELINE ══ */}
      <div className="card space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 2</div>
            <h2 className="heading-md">League Structure & Season Schedule</h2>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-center">
          {[
            { step: '1', title: 'Aug 2026', desc: 'Season Launch' },
            { step: '2', title: 'Every Saturday', desc: 'Weekly Rounds' },
            { step: '3', title: 'Monthly Rank', desc: 'LP Accumulation' },
            { step: '4', title: 'Monthly Winners', desc: '₹6,000 Cash Prizes' },
            { step: '5', title: 'Hall of Fame', desc: 'Annual Legends' },
            { step: '6', title: 'Season Continues', desc: 'Continuous Growth' },
            { step: '7', title: 'Aug 2027', desc: 'Season Grand Finale' },
          ].map((item) => (
            <div key={item.step} className="bg-midnight/80 border border-neon-cyan/20 rounded-xl p-3 relative flex flex-col justify-between">
              <div className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan text-xs font-bold flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <div className="font-heading text-white text-xs font-bold mb-1">{item.title}</div>
              <div className="text-text-secondary text-[10px]">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Weekly Rotation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <div className="card p-3 text-center border-electric-blue/30 bg-electric-blue/5">
            <div className="text-xs font-bold text-electric-blue uppercase">Week 1</div>
            <div className="text-white text-sm font-semibold mt-1">Online Contest</div>
            <div className="text-text-secondary text-[11px] mt-1">HackerRank / CF</div>
          </div>
          <div className="card p-3 text-center border-neon-cyan/30 bg-neon-cyan/5">
            <div className="text-xs font-bold text-neon-cyan uppercase">Week 2</div>
            <div className="text-white text-sm font-semibold mt-1">Offline Contest</div>
            <div className="text-text-secondary text-[11px] mt-1">BVRIT Campus Venue</div>
          </div>
          <div className="card p-3 text-center border-electric-blue/30 bg-electric-blue/5">
            <div className="text-xs font-bold text-electric-blue uppercase">Week 3</div>
            <div className="text-white text-sm font-semibold mt-1">Online Contest</div>
            <div className="text-text-secondary text-[11px] mt-1">CodeChef / Platform</div>
          </div>
          <div className="card p-3 text-center border-neon-cyan/30 bg-neon-cyan/5">
            <div className="text-xs font-bold text-neon-cyan uppercase">Week 4</div>
            <div className="text-white text-sm font-semibold mt-1">Offline Contest</div>
            <div className="text-text-secondary text-[11px] mt-1">BVRIT Campus Venue</div>
          </div>
          <div className="card p-3 text-center border-gold/30 bg-gold/5">
            <div className="text-xs font-bold text-gold uppercase">Week 5 (If 5th Sat)</div>
            <div className="text-white text-sm font-semibold mt-1">Bonus Challenge</div>
            <div className="text-text-secondary text-[11px] mt-1">Special LP & Badges</div>
          </div>
        </div>
      </div>

      {/* ══ SECTION 3: CONTEST FLOW ══ */}
      <div className="card space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 3</div>
            <h2 className="heading-md">Contest Flow Lifecycle</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { num: '01', title: 'Register Once', desc: 'Get your permanent CBB Participant ID.' },
            { num: '02', title: 'Compete Every Saturday', desc: 'Solve algorithmic challenges on schedule.' },
            { num: '03', title: 'Contest Ends', desc: 'Submissions locked & penalty verified.' },
            { num: '04', title: 'Admin Publishes Results', desc: 'Verified handle matches imported.' },
            { num: '05', title: 'Ratings Updated', desc: 'Elo v1.0 formula recalculates scores.' },
            { num: '06', title: 'Monthly Points Added', desc: 'League Points added to monthly total.' },
            { num: '07', title: 'Leaderboards Live', desc: 'Real-time ranks updated on dashboard.' },
            { num: '08', title: 'Certificates Issued', desc: 'Verifiable credentials released.' },
          ].map((step) => (
            <div key={step.num} className="bg-midnight/80 border border-neon-cyan/20 rounded-xl p-4 space-y-2 hover:border-neon-cyan/40 transition-colors">
              <div className="font-numbers text-neon-cyan font-bold text-lg">{step.num}</div>
              <div className="text-white text-xs font-heading font-bold">{step.title}</div>
              <div className="text-text-secondary text-[11px] leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ SECTION 4: REGISTRATION & PARTICIPANT ID ══ */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <User size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 4</div>
            <h2 className="heading-md">One-Time Registration & CWCL ID</h2>
          </div>
        </div>

        <p className="text-text-secondary text-sm leading-relaxed">
          CWCL registration is a one-time process. Once registered, you receive a permanent <strong>CWCL Participant ID</strong>
          (for example: <code className="text-neon-cyan font-numbers bg-neon-cyan/10 px-2 py-0.5 rounded border border-neon-cyan/20">CBB000123</code>).
        </p>

        <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-text-secondary">Your Assigned Season ID</div>
            <div className="stat-number text-2xl text-neon-cyan">{participant?.participantId ?? 'CBB000123'}</div>
          </div>
          <div className="text-xs text-text-secondary max-w-md">
            This ID links your performance across HackerRank, Codeforces, CodeChef, and LeetCode directly into your official CWCL Profile.
          </div>
        </div>
      </div>

      {/* ══ SECTION 5 & 6: RATING SYSTEM & TITLES ══ */}
      <div className="card space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Sections 5 & 6</div>
            <h2 className="heading-md">CWCL Rating System & 9 Official Titles</h2>
          </div>
        </div>

        <div className="bg-midnight/80 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-white text-sm font-heading font-bold">Rating Rules Summary</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-secondary">
            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-neon-cyan shrink-0" /> Every participant starts at <strong>800 Rating</strong> (Beginner).</li>
            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-neon-cyan shrink-0" /> Rating is permanent and <strong>never resets</strong>.</li>
            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-neon-cyan shrink-0" /> Minimum rating floor is <strong>800</strong> (cannot fall below 800).</li>
            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-neon-cyan shrink-0" /> Updates automatically after every completed contest.</li>
          </ul>
        </div>

        {/* 9 Titles Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {TIER_THRESHOLDS.map((t) => {
            const cfg = TIER_CONFIG[t.tier];
            const rangeStr = t.tier === 'Legendary Grandmaster' ? '2100+' : `${t.min}–${t.max}`;
            return (
              <div key={t.tier} className={`card p-4 border ${cfg.border} bg-midnight/90 hover:scale-[1.02] transition-transform`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-heading font-bold px-2.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                    {t.tier}
                  </span>
                  <span className="font-numbers font-bold text-xs text-white">{rangeStr}</span>
                </div>
                <div className="text-[11px] text-text-secondary mt-2">
                  Official CWCL Rating Rank Title.
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ SECTION 7: MONTHLY POINTS VS RATING ══ */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <Trophy size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 7</div>
            <h2 className="heading-md">Monthly League Points vs. Rating</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-text-secondary">
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3 text-electric-blue">Monthly League Points (LP)</th>
                <th className="py-2.5 px-3 text-neon-cyan">Rating (Elo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Reset Frequency</td>
                <td className="py-2.5 px-3 text-text-secondary">Resets every month (1st of month)</td>
                <td className="py-2.5 px-3 text-text-secondary">Permanent (Never resets)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Primary Purpose</td>
                <td className="py-2.5 px-3 text-text-secondary">Used for Monthly Cash Prizes & Champion titles</td>
                <td className="py-2.5 px-3 text-text-secondary">Used for Skill Rating, Titles & Leaderboard</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Starting Base</td>
                <td className="py-2.5 px-3 text-text-secondary">0 LP each month</td>
                <td className="py-2.5 px-3 text-text-secondary">800 Rating starting base</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Minimum Floor</td>
                <td className="py-2.5 px-3 text-text-secondary">0 LP</td>
                <td className="py-2.5 px-3 text-text-secondary">800 Rating Floor</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ SECTION 8: MONTHLY PRIZE DISTRIBUTION ══ */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <Crown size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 8</div>
            <h2 className="heading-md">Monthly Cash Prize Distribution</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="card p-4 text-center border-gold/30 bg-gold/5">
            <div className="text-3xl mb-2">🥇</div>
            <div className="font-heading text-gold text-xs font-bold uppercase">1st Place Champion</div>
            <div className="stat-number text-2xl text-gold mt-1">₹3,000</div>
            <div className="text-[10px] text-text-secondary mt-1">Highest Monthly LP</div>
          </div>
          <div className="card p-4 text-center border-silver/30 bg-silver/5">
            <div className="text-3xl mb-2">🥈</div>
            <div className="font-heading text-silver text-xs font-bold uppercase">2nd Place Winner</div>
            <div className="stat-number text-2xl text-silver mt-1">₹2,000</div>
            <div className="text-[10px] text-text-secondary mt-1">2nd Highest Monthly LP</div>
          </div>
          <div className="card p-4 text-center border-bronze/30 bg-bronze/5">
            <div className="text-3xl mb-2">🥉</div>
            <div className="font-heading text-bronze text-xs font-bold uppercase">3rd Place Winner</div>
            <div className="stat-number text-2xl text-bronze mt-1">₹1,000</div>
            <div className="text-[10px] text-text-secondary mt-1">3rd Highest Monthly LP</div>
          </div>
        </div>
      </div>

      {/* ══ SECTION 9: PERFORMANCE ZONES & RATING DELTAS ══ */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 9</div>
            <h2 className="heading-md">Performance Zones & Rating Math</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="bg-midnight/80 border border-success/30 rounded-xl p-3">
            <div className="text-xs text-text-secondary">Outstanding (Top 5%)</div>
            <div className="stat-number text-lg text-success mt-1">+35</div>
          </div>
          <div className="bg-midnight/80 border border-emerald-400/30 rounded-xl p-3">
            <div className="text-xs text-text-secondary">Excellent (Top 15%)</div>
            <div className="stat-number text-lg text-emerald-400 mt-1">+25</div>
          </div>
          <div className="bg-midnight/80 border border-cyan-400/30 rounded-xl p-3">
            <div className="text-xs text-text-secondary">Good (Top 30%)</div>
            <div className="stat-number text-lg text-cyan-400 mt-1">+15</div>
          </div>
          <div className="bg-midnight/80 border border-electric-blue/30 rounded-xl p-3">
            <div className="text-xs text-text-secondary">Average (Middle 40%)</div>
            <div className="stat-number text-lg text-electric-blue mt-1">+5</div>
          </div>
          <div className="bg-midnight/80 border border-rose-400/30 rounded-xl p-3">
            <div className="text-xs text-text-secondary">Poor (Bottom 20%)</div>
            <div className="stat-number text-lg text-rose-400 mt-1">-5</div>
          </div>
          <div className="bg-midnight/80 border border-red-500/30 rounded-xl p-3">
            <div className="text-xs text-text-secondary">Very Poor (Bottom 10%)</div>
            <div className="stat-number text-lg text-red-500 mt-1">-15</div>
          </div>
        </div>
      </div>

      {/* ══ SECTION 13: FAQ ACCORDION ══ */}
      <div className="card space-y-4 p-4 sm:p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
            <HelpCircle size={20} />
          </div>
          <div>
            <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 13</div>
            <h2 className="heading-md">Frequently Asked Questions</h2>
          </div>
        </div>

        <div className="space-y-3">
          {GUIDE_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="bg-midnight/80 border border-neon-cyan/20 hover:border-neon-cyan/40 rounded-xl p-4 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-semibold">{faq.q}</h3>
                  <ChevronDown size={16} className={`text-neon-cyan transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {isOpen && <p className="text-text-secondary text-xs leading-relaxed mt-3 pt-3 border-t border-white/10">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ SECTION 15: NEED HELP ══ */}
      <div className="card p-4 sm:p-5 md:p-6 border-neon-cyan/30 bg-gradient-to-r from-midnight to-navy">
        <div>
          <div className="text-xs font-heading text-neon-cyan uppercase tracking-widest">Section 15</div>
          <h2 className="heading-md text-white mt-1">Need Help or Have Questions?</h2>
          <p className="text-text-secondary text-xs sm:text-sm mt-1 leading-relaxed">
            Reach out to the Coding Brigade BVRIT & CSI BVRIT Organizing Team.
          </p>
          <a
            href="mailto:cbb@bvrit.ac.in"
            className="inline-flex items-center gap-2 mt-3 text-neon-cyan text-xs sm:text-sm hover:text-white transition-colors"
          >
            <Mail size={14} /> Contact Team via Email
          </a>
        </div>
      </div>
    </div>
  );
}
