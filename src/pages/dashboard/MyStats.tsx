import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { ContestResult } from '../../types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { TrendingUp, Trophy, Target, Zap, BarChart2, ListOrdered } from 'lucide-react';

const TIP = {
  contentStyle: { background: '#0B1120', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#94A3B8' },
  itemStyle: { color: '#00E5FF' },
};

function StatCard({ icon: Icon, label, value, color = 'text-neon-cyan', sub }: {
  icon: React.ElementType; label: string; value: string | number; color?: string; sub?: string;
}) {
  return (
    <div className="card text-center py-5">
      <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center mx-auto mb-2">
        <Icon size={14} className={color} />
      </div>
      <div className={`stat-number text-2xl ${color}`}>{value}</div>
      <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1">{label}</div>
      {sub && <div className="text-text-secondary/50 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function MyStats() {
  const { participant } = useAuth();
  const [results, setResults] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participant) return;

    // Real-time listener — new results appear immediately after admin import
    const q = query(
      collection(db, 'contestResults'),
      where('participantId', '==', participant.participantId),
      orderBy('contestId', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setResults(snap.docs.map(d => d.data() as ContestResult));
        setLoading(false);
      },
      () => { setLoading(false); }
    );
    return () => unsub();
  }, [participant]);

  if (!participant) return null;

  // Derived stats
  const totalLP     = results.reduce((s, r) => s + r.leaguePoints, 0);
  const avgScore    = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const bestRank    = results.length ? Math.min(...results.map(r => r.rank)) : 0;
  const winCount    = results.filter(r => r.rank === 1).length;
  const top3Count   = results.filter(r => r.rank <= 3).length;
  const top10Count  = results.filter(r => r.rank <= 10).length;
  const ratingDelta = results.length ? results[results.length - 1].ratingAfter - results[0].ratingBefore : 0;

  // Chart data
  const ratingData = results.map((r, i) => ({ label: `C${i + 1}`, rating: r.ratingAfter }));
  const scoreData  = results.map((r, i) => ({ label: `C${i + 1}`, score: r.score }));
  const lpData     = results.map((r, i) => ({ label: `C${i + 1}`, lp: r.leaguePoints }));

  // Radar data — normalize 0-100
  const radarData = results.length ? [
    { subject: 'Rating',    A: Math.min(100, Math.round((participant.rating / 2200) * 100)) },
    { subject: 'Attendance',A: Math.round(participant.attendance ?? 0) },
    { subject: 'Top 10',    A: results.length ? Math.round((top10Count / results.length) * 100) : 0 },
    { subject: 'Avg Score', A: Math.min(100, Math.round((avgScore / 300) * 100)) },
    { subject: 'LP/Contest',A: Math.min(100, results.length ? Math.round((totalLP / results.length / 100) * 100) : 0) },
  ] : [];

  const rankColor = (rank: number) =>
    rank === 1 ? 'text-gold' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-text-secondary';

  return (
    <div className="space-y-6">

      <div>
        <h1 className="heading-md">My Statistics</h1>
        <p className="text-text-secondary text-xs mt-1">Your full performance history across CWCL contests.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-16">
          <BarChart2 size={48} className="text-neon-cyan/20 mx-auto mb-4" />
          <h3 className="heading-sm mb-2">No Data Yet</h3>
          <p className="text-text-secondary text-sm">Participate in a contest to see your stats here.</p>
        </div>
      ) : (
        <>
          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={TrendingUp} label="Rating"      value={participant.rating}  color="text-neon-cyan"    />
            <StatCard icon={Zap}        label="Total LP"    value={totalLP}             color="text-electric-blue" />
            <StatCard icon={Target}     label="Avg Score"   value={avgScore}            color="text-success"      />
            <StatCard icon={Trophy}     label="Best Rank"   value={`#${bestRank}`}      color="text-gold"         />
            <StatCard icon={Trophy}     label="Wins"        value={winCount}            color="text-gold"    sub="Rank #1" />
            <StatCard icon={ListOrdered}label="Top 3"       value={top3Count}           color="text-neon-cyan"    />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Rating history — spans 2 cols */}
            <div className="xl:col-span-2 card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-sm !text-sm">Rating History</h2>
                <span className={`text-xs font-numbers font-bold ${ratingDelta >= 0 ? 'text-success' : 'text-red-400'}`}>
                  {ratingDelta >= 0 ? '+' : ''}{ratingDelta} overall
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip {...TIP} />
                    <Line type="monotone" dataKey="rating" stroke="#00E5FF" strokeWidth={2.5}
                      dot={{ fill: '#00E5FF', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#00E5FF' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar */}
            <div className="card">
              <h2 className="heading-sm !text-sm mb-4">Performance Radar</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(0,229,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <Radar dataKey="A" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.15} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Score + LP charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="heading-sm !text-sm mb-4">Score Per Contest</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <Tooltip {...TIP} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {scoreData.map((_, i) => <Cell key={i} fill="#3B82F6" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="heading-sm !text-sm mb-4">League Points Per Contest</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lpData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <Tooltip {...TIP} />
                    <Bar dataKey="lp" radius={[4, 4, 0, 0]}>
                      {lpData.map((e, i) => (
                        <Cell key={i} fill={e.lp >= 85 ? '#00E5FF' : e.lp >= 50 ? '#3B82F6' : '#475569'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Full Contest Log ── */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ListOrdered size={14} className="text-neon-cyan" />
              <h2 className="heading-sm !text-sm">Full Contest Log</h2>
              <span className="text-text-secondary text-[10px] ml-auto">{results.length} contests</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body min-w-[640px]">
                <thead>
                  <tr className="border-b border-neon-cyan/10">
                    {['Contest', 'Rank', 'Solved', 'Score', 'Penalty', 'LP', 'Before', 'After', 'Δ'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map(r => {
                    const delta = r.ratingAfter - r.ratingBefore;
                    return (
                      <tr key={r.id} className="hover:bg-neon-cyan/5 transition-colors">
                        <td className="py-3 px-3 text-white font-medium">{(r as any).contestName ?? r.contestId}</td>
                        <td className="py-3 px-3 font-numbers">
                          <span className={rankColor(r.rank)}>#{r.rank}</span>
                        </td>
                        <td className="py-3 px-3 font-numbers text-text-secondary">{r.problemsSolved}</td>
                        <td className="py-3 px-3 font-numbers text-white">{r.score}</td>
                        <td className="py-3 px-3 font-numbers text-text-secondary">{r.penalty}</td>
                        <td className="py-3 px-3 font-numbers text-neon-cyan font-bold">{r.leaguePoints}</td>
                        <td className="py-3 px-3 font-numbers text-text-secondary">{r.ratingBefore}</td>
                        <td className="py-3 px-3 font-numbers text-white">{r.ratingAfter}</td>
                        <td className={`py-3 px-3 font-numbers font-bold ${delta >= 0 ? 'text-success' : 'text-red-400'}`}>
                          {delta >= 0 ? '+' : ''}{delta}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
