import { useEffect, useState } from 'react';
import { Search, Crown } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Participant } from '../../types';
import { TIER_CONFIG } from '../../lib/ratingEngine';

export default function Leaderboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');

  useEffect(() => {
    // Real-time — ordered by rating, filter admins client-side
    const q = query(
      collection(db, 'participants'),
      orderBy('rating', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(q, snap => {
      setParticipants(
        snap.docs
          .map(d => ({ uid: d.id, ...d.data() } as Participant))
          .filter(p => p.role !== 'admin' && p.role !== 'super_admin')
      );
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = participants.filter(p =>
    !search ||
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.college.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="heading-lg mb-3">CWCL Rankings</h1>
          <p className="text-text-secondary text-sm">Season 2026–27 Overall Leaderboard · updates live</p>
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
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Contests</th>
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Badges</th>
                  <th className="text-center px-4 py-3 uppercase tracking-wider text-[10px]">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-cyan/5">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-text-secondary">
                    <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin mx-auto" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-text-secondary">
                    {participants.length === 0 ? 'No results published yet. Check back after the first contest!' : 'No results match your search.'}
                  </td></tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.uid} className="hover:bg-neon-cyan/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`font-numbers font-bold text-sm ${
                          i === 0 ? 'text-gold' : i === 1 ? 'text-silver' : i === 2 ? 'text-bronze' : 'text-text-secondary'
                        }`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        <div className="flex items-center gap-1.5">
                          {p.fullName}
                          {p.foundingMember && (
                            <span title="Founding Member" className="text-gold"><Crown size={12} /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{p.college}</td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const cfg = TIER_CONFIG[p.tier] ?? TIER_CONFIG.Beginner;
                          return (
                            <span className={`text-[10px] font-heading font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {p.tier}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center font-numbers text-text-secondary">{p.contestsParticipated}</td>
                      <td className="px-4 py-3 text-center font-numbers text-text-secondary">{p.badges?.length ?? 0}</td>
                      <td className="px-4 py-3 text-center font-numbers text-text-secondary">{(p.attendance ?? 0).toFixed(1)}%</td>
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
