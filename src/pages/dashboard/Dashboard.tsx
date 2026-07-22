import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Trophy, Calendar, Award, Percent, Zap, Star } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Contest, ContestResult } from '../../types';
import { BADGE_META } from '../../types';

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-neon-cyan" />
      </div>
      <div>
        <div className="text-text-secondary text-[10px] uppercase tracking-widest font-body">{label}</div>
        <div className="stat-number text-xl">{value}</div>
        {sub && <div className="text-text-secondary/60 text-[10px] font-body">{sub}</div>}
      </div>
    </div>
  );
}

function CountdownTimer({ startTime }: { startTime: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function calc() {
      const diff = new Date(startTime).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Live Now!'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(
        h > 24
          ? `${Math.floor(h / 24)}d ${h % 24}h`
          : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return <span className="stat-number text-2xl">{remaining}</span>;
}

export default function Dashboard() {
  const { participant } = useAuth();
  const [upcomingContest, setUpcomingContest] = useState<Contest | null>(null);
  const [recentResults, setRecentResults]     = useState<ContestResult[]>([]);
  const [loadingContest, setLoadingContest]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch next upcoming contest
        const contestQ = query(
          collection(db, 'contests'),
          where('status', '==', 'Upcoming'),
          orderBy('date', 'asc'),
          limit(1)
        );
        const contestSnap = await getDocs(contestQ);
        if (!contestSnap.empty) {
          setUpcomingContest(contestSnap.docs[0].data() as Contest);
        }

        // Fetch participant's recent results
        if (participant) {
          const resultsQ = query(
            collection(db, 'contestResults'),
            where('participantId', '==', participant.participantId),
            orderBy('contestId', 'desc'),
            limit(5)
          );
          const resultsSnap = await getDocs(resultsQ);
          setRecentResults(resultsSnap.docs.map(d => d.data() as ContestResult));
        }
      } catch (e) {
        // silently fail — data will be empty
      } finally {
        setLoadingContest(false);
      }
    }
    load();
  }, [participant]);

  if (!participant) return null;

  const tierColors: Record<string, string> = {
    Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
    Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
  };

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Welcome Banner ── */}
      <div className="card-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md mb-1">Welcome, {participant.fullName.split(' ')[0]} 👋</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-numbers text-xs text-text-secondary">{participant.participantId}</span>
            <span className={tierColors[participant.tier]}>
              {participant.tier}
            </span>
          </div>
        </div>
        <Link to="/schedule" className="btn-primary text-xs px-5 py-2 flex items-center gap-2">
          <Calendar size={12} /> View Schedule
        </Link>
      </div>

      {/* ── Stat Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Rating"         value={participant.rating} />
        <StatCard icon={Trophy}     label="Contests"       value={participant.contestsParticipated} />
        <StatCard icon={Percent}    label="Attendance"     value={`${participant.attendance.toFixed(1)}%`} />
        <StatCard icon={Award}      label="Badges"         value={participant.badges.length} />
      </div>

      {/* ── Two Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Contest */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-neon-cyan" />
            <h2 className="heading-sm">Upcoming Contest</h2>
          </div>
          {loadingContest ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
            </div>
          ) : upcomingContest ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-white text-sm">{upcomingContest.name}</h3>
                  <p className="text-text-secondary text-xs mt-1">
                    {upcomingContest.mode} · {upcomingContest.platform ?? 'BVRIT'} · {upcomingContest.duration} min
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-warning text-[10px] font-numbers shrink-0">
                  <Zap size={9} /> Upcoming
                </span>
              </div>
              <div className="bg-midnight rounded-lg p-4 text-center">
                <div className="text-text-secondary text-[10px] uppercase tracking-widest mb-1">Starts In</div>
                <CountdownTimer startTime={upcomingContest.startTime} />
              </div>
              <div className="flex gap-3">
                {upcomingContest.contestLink && (
                  <a href={upcomingContest.contestLink} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-4">
                    Join Contest
                  </a>
                )}
                <Link to="/schedule" className="btn-secondary text-xs py-2 px-4">Full Schedule</Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar size={32} className="text-neon-cyan/20 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No upcoming contest scheduled yet.</p>
              <Link to="/schedule" className="text-neon-cyan text-xs hover:underline mt-2 inline-block">
                View Schedule →
              </Link>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-neon-cyan" />
            <h2 className="heading-sm">Your Badges</h2>
          </div>
          {participant.badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {participant.badges.map((b) => {
                const meta = BADGE_META[b.type];
                return (
                  <div key={b.type} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-midnight border border-neon-cyan/10 hover:border-neon-cyan/30 transition-colors">
                    <span className="text-xl">{meta.emoji}</span>
                    <span className="text-[9px] text-text-secondary text-center leading-tight">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Star size={28} className="text-neon-cyan/20 mx-auto mb-3" />
              <p className="text-text-secondary text-xs leading-relaxed">
                Compete in contests to earn badges!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Results ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-neon-cyan" />
            <h2 className="heading-sm">Recent Performances</h2>
          </div>
          <Link to="/dashboard/stats" className="text-neon-cyan text-xs hover:underline">View All →</Link>
        </div>

        {recentResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="text-text-secondary/70 border-b border-neon-cyan/10">
                  <th className="text-left py-2 pr-4 uppercase tracking-wider text-[10px]">Contest</th>
                  <th className="text-center py-2 px-2 uppercase tracking-wider text-[10px]">Rank</th>
                  <th className="text-center py-2 px-2 uppercase tracking-wider text-[10px]">Score</th>
                  <th className="text-center py-2 px-2 uppercase tracking-wider text-[10px]">LP</th>
                  <th className="text-right py-2 pl-2 uppercase tracking-wider text-[10px]">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-cyan/5">
                {recentResults.map((r) => (
                  <tr key={r.id} className="hover:bg-neon-cyan/5 transition-colors">
                    <td className="py-3 pr-4 text-white">{r.contestId}</td>
                    <td className="py-3 px-2 text-center font-numbers">
                      <span className={
                        r.rank === 1 ? 'text-gold' :
                        r.rank === 2 ? 'text-silver' :
                        r.rank === 3 ? 'text-bronze' : 'text-text-secondary'
                      }>#{r.rank}</span>
                    </td>
                    <td className="py-3 px-2 text-center font-numbers text-white">{r.score}</td>
                    <td className="py-3 px-2 text-center font-numbers text-neon-cyan">{r.leaguePoints}</td>
                    <td className="py-3 pl-2 text-right font-numbers">
                      <span className={r.ratingAfter > r.ratingBefore ? 'text-success' : 'text-red-400'}>
                        {r.ratingAfter > r.ratingBefore ? '+' : ''}{r.ratingAfter - r.ratingBefore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy size={32} className="text-neon-cyan/20 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">No contest results yet.</p>
            <p className="text-text-secondary/60 text-xs mt-1">Participate in a contest to see your stats here.</p>
          </div>
        )}
      </div>

    </div>
  );
}
