import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { SeasonStanding } from '../../types';

const TIER_CLASS: Record<string, string> = {
  Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
  Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
};

export default function Leaderboard() {
  const [standings, setStandings] = useState<SeasonStanding[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'seasonStandings'), orderBy('rank', 'asc'), limit(100));
        const snap = await getDocs(q);
        setStandings(snap.docs.map(d => d.data() as SeasonStanding));
      } catch { /* empty */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = standings.filter(s =>
    s.participantName.toLowerCase().includes(search.toLowerCase()) ||
    s.college.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="heading-lg mb-3">CWCL Rankings</h1>
          <p className="text-text-secondary text-sm">Season 2026–27 Overall Leaderboard</p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6 max-w-xl">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input className="input-field pl-9" placeholder="Search by name or college…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead className="bg-navy">
                <tr className="text-text-secondary/70 border-b border-neon-cyan/10">
                  <th className="text-left px-4 py-3 uppercase tracking-wider text-[10px]">Rank</th>
                  <th className="text-left px-4 py-3 uppercase tracking-wider text-[10px]">Participant</th>
                  <th className="text-left px-4 py-3 uppercase tracking-wider text-[10px]">College</th>
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Rating</th>
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Tier</th>
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Points</th>
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Wins</th>
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-cyan/5">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-text-secondary">Loading rankings…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-text-secondary">
                    {standings.length === 0 ? 'No results published yet. Check back after the first contest!' : 'No results match your search.'}
                  </td></tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr key={s.participantId} className="hover:bg-neon-cyan/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`font-numbers font-bold text-sm ${
                          i === 0 ? 'text-gold' : i === 1 ? 'text-silver' : i === 2 ? 'text-bronze' : 'text-text-secondary'
                        }`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${s.rank}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{s.participantName}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.college}</td>
                      <td className="px-4 py-3 text-center font-numbers text-neon-cyan">{s.rating}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={TIER_CLASS[s.tier] ?? 'tier-beginner'}>{s.tier}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-numbers text-white">{s.totalLeaguePoints}</td>
                      <td className="px-4 py-3 text-center font-numbers text-success">{s.wins}</td>
                      <td className="px-4 py-3 text-center font-numbers text-text-secondary">{s.attendance.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
