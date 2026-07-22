import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { ContestResult } from '../../types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

const TIP = { contentStyle: { background: '#111827', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, fontSize: 11 }, labelStyle: { color: '#CBD5E1' }, itemStyle: { color: '#00E5FF' } };

export default function MyStats() {
  const { participant } = useAuth();
  const [results, setResults] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participant) return;
    async function load() {
      try {
        const q = query(
          collection(db, 'contestResults'),
          where('participantId', '==', participant!.participantId),
          orderBy('contestId', 'asc')
        );
        const snap = await getDocs(q);
        setResults(snap.docs.map(d => d.data() as ContestResult));
      } catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, [participant]);

  if (!participant) return null;

  const ratingData   = results.map((r, i) => ({ label: `C${i + 1}`, rating:  r.ratingAfter }));
  const scoreData    = results.map((r, i) => ({ label: `C${i + 1}`, score:   r.score       }));
  const lpData       = results.map((r, i) => ({ label: `C${i + 1}`, lp:      r.leaguePoints }));

  const totalLP      = results.reduce((s, r) => s + r.leaguePoints,      0);
  const avgScore     = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const bestRank     = results.length ? Math.min(...results.map(r => r.rank)) : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="heading-md mb-1">My Statistics</h1>
        <p className="text-text-secondary text-xs">Your performance across all CWCL contests this season.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary text-sm">No contest data yet. Participate in a contest to see your stats!</p>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Current Rating', value: participant.rating,         color: 'text-neon-cyan' },
              { label: 'Total LP',       value: totalLP,                    color: 'text-electric-blue' },
              { label: 'Avg Score',      value: avgScore,                   color: 'text-success' },
              { label: 'Best Rank',      value: `#${bestRank}`,             color: 'text-gold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card text-center">
                <div className={`stat-number text-2xl ${color}`}>{value}</div>
                <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Rating History */}
          <div className="card">
            <h2 className="heading-sm mb-4">Rating History</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#CBD5E1', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip {...TIP} />
                  <Line type="monotone" dataKey="rating" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Per Contest */}
          <div className="card">
            <h2 className="heading-sm mb-4">Score Per Contest</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#CBD5E1', fontSize: 10 }} />
                  <Tooltip {...TIP} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {scoreData.map((_, i) => <Cell key={i} fill="#3B82F6" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* League Points */}
          <div className="card">
            <h2 className="heading-sm mb-4">League Points Per Contest</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lpData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#CBD5E1', fontSize: 10 }} />
                  <Tooltip {...TIP} />
                  <Bar dataKey="lp" radius={[4, 4, 0, 0]}>
                    {lpData.map((entry, i) => (
                      <Cell key={i} fill={entry.lp >= 85 ? '#00E5FF' : entry.lp >= 50 ? '#3B82F6' : '#475569'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed table */}
          <div className="card">
            <h2 className="heading-sm mb-4">Full Contest Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead>
                  <tr className="text-text-secondary/70 border-b border-neon-cyan/10">
                    {['Contest','Rank','Score','Penalty','LP','Rating Before','Rating After','Δ'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neon-cyan/5">
                  {results.map(r => {
                    const delta = r.ratingAfter - r.ratingBefore;
                    return (
                      <tr key={r.id} className="hover:bg-neon-cyan/5 transition-colors">
                        <td className="py-2.5 px-2 text-white">{r.contestId}</td>
                        <td className="py-2.5 px-2 font-numbers">
                          <span className={r.rank <= 3 ? ['','text-gold','text-silver','text-bronze'][r.rank] : 'text-text-secondary'}>#{r.rank}</span>
                        </td>
                        <td className="py-2.5 px-2 font-numbers text-white">{r.score}</td>
                        <td className="py-2.5 px-2 font-numbers text-text-secondary">{r.penalty}</td>
                        <td className="py-2.5 px-2 font-numbers text-neon-cyan">{r.leaguePoints}</td>
                        <td className="py-2.5 px-2 font-numbers text-text-secondary">{r.ratingBefore}</td>
                        <td className="py-2.5 px-2 font-numbers text-white">{r.ratingAfter}</td>
                        <td className={`py-2.5 px-2 font-numbers font-bold ${delta >= 0 ? 'text-success' : 'text-red-400'}`}>
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
