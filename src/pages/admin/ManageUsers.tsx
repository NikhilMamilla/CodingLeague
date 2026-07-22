import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Participant } from '../../types';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIER_CLASS: Record<string, string> = {
  Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
  Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
};

export default function ManageUsers() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search,  setSearch]            = useState('');

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'participants'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setParticipants(snap.docs.map(d => d.data() as Participant));
      } catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = participants.filter(p =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.college?.toLowerCase().includes(search.toLowerCase()) ||
    p.participantId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md mb-1">Participants</h1>
          <p className="text-text-secondary text-xs">{participants.length} registered participants</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
        <input className="input-field pl-9" placeholder="Search by name, email, college…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body">
            <thead className="bg-navy">
              <tr className="text-text-secondary/70 border-b border-neon-cyan/10">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider">Participant</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider">College</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider">Tier</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider">Rating</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider">Contests</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neon-cyan/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-secondary">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-secondary">
                  {participants.length === 0 ? 'No participants yet.' : 'No results found.'}
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.uid} className="hover:bg-neon-cyan/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{p.fullName}</div>
                    <div className="text-text-secondary/70 text-[10px] font-numbers">{p.participantId} · {p.email}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.college}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={TIER_CLASS[p.tier] ?? 'tier-beginner'}>{p.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-numbers text-neon-cyan">{p.rating}</td>
                  <td className="px-4 py-3 text-center font-numbers text-white">{p.contestsParticipated}</td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/profile/${p.participantId}`} target="_blank"
                      className="text-neon-cyan text-[10px] hover:underline">View Profile</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
