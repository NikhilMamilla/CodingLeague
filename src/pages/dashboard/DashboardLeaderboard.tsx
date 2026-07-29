import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, TrendingUp, Search, Medal, Crown, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getParticipants, getAllResults } from '../../lib/db';
const TIER_CLASS: Record<string, string> = {
  Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
  Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
};

const TIER_ORDER = ['Grandmaster', 'Master', 'Expert', 'Coder', 'Explorer', 'Beginner'];

type Tab = 'overall' | 'tier' | 'college';

interface LeaderRow {
  rank:   number;
  uid:    string;
  name:   string;
  id:     string;
  college: string;
  branch: string;
  year:   string;
  rating: number;
  tier:   string;
  contests: number;
  attendance: number;
  badges: number;
  foundingMember?: boolean;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-xs font-numbers text-text-secondary w-6 text-center">#{rank}</span>;
}

export default function DashboardLeaderboard() {
  const { participant } = useAuth();
  const [rows,    setRows]    = useState<LeaderRow[]>([]);
  const [contestCounts, setContestCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>('overall');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    getParticipants(200).then(data => {
      setRows(data
        .filter(p => p.role !== 'admin' && p.role !== 'super_admin')
        .map((p, i) => ({
          rank: i + 1, uid: p.uid, name: p.fullName, id: p.participantId,
          college: p.college, branch: p.branch, year: p.year,
          rating: p.rating, tier: p.tier, contests: p.contestsParticipated,
          attendance: p.attendance ?? 0, badges: p.badges?.length ?? 0,
          foundingMember: p.foundingMember,
        })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    getAllResults().then(results => {
      const map: Record<string, Set<string>> = {};
      results.forEach(r => {
        if (!r.participantId || !r.contestId) return;
        map[r.participantId] ??= new Set();
        map[r.participantId].add(r.contestId);
      });
      setContestCounts(Object.fromEntries(Object.entries(map).map(([id, s]) => [id, s.size])));
    }).catch(() => {});
  }, []);

  const rowsWithActualContests = rows.map(r => ({
    ...r,
    contests: contestCounts[r.id] ?? 0,
  }));

  const myContestCount = participant ? contestCounts[participant.participantId] ?? 0 : 0;

  // My rank
  const myRank = rowsWithActualContests.findIndex(r => r.uid === participant?.uid);

  // Filtered rows based on tab + search
  const base = tab === 'overall'
    ? rowsWithActualContests
    : tab === 'college'
    ? rowsWithActualContests.filter(r => r.college === participant?.college)
    : rowsWithActualContests; // tier handled below

  const searched = base.filter(r =>
    search === '' ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.college.toLowerCase().includes(search.toLowerCase())
  );

  // Group by tier for tier tab
  const byTier = TIER_ORDER.reduce<Record<string, LeaderRow[]>>((acc, t) => {
    acc[t] = rowsWithActualContests.filter(r => r.tier === t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md">Leaderboard</h1>
          <p className="text-text-secondary text-xs mt-1">Top participants ranked by rating this season.</p>
        </div>
        <Link to="/leaderboard" target="_blank"
          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 self-start sm:self-auto">
          <TrendingUp size={12} /> Full Public Board
        </Link>
      </div>

      {/* My rank banner */}
      {participant && myRank >= 0 && (
        <div className="card-glow flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center overflow-hidden">
              {participant.photoURL
                ? <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="font-heading text-base text-neon-cyan font-bold">
                    {participant.fullName.charAt(0)}
                  </span>
              }
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold text-sm">{participant.fullName}</span>
                {participant.foundingMember && (
                  <span title="Founding Member" className="text-gold"><Crown size={12} /></span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={TIER_CLASS[participant.tier]}>{participant.tier}</span>
                <span className="text-text-secondary text-[10px]">{participant.participantId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="stat-number text-2xl text-neon-cyan">#{myRank + 1}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider">Overall Rank</div>
            </div>
            <div className="text-center">
              <div className="stat-number text-2xl text-electric-blue">{participant.rating}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider">Rating</div>
            </div>
            <div className="text-center">
              <div className="stat-number text-2xl text-success">{myContestCount}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider">Contests</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {([
          { key: 'overall', label: 'Overall', icon: Trophy     },
          { key: 'college', label: 'My College', icon: Medal   },
          { key: 'tier',    label: 'By Tier',  icon: Crown     },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-body transition-all ${
              tab === key
                ? 'bg-neon-cyan text-midnight font-bold'
                : 'text-text-secondary hover:text-white'
            }`}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : tab === 'tier' ? (

        /* ── Tier groups ── */
        <div className="space-y-6">
          {TIER_ORDER.map(t => {
            const group = byTier[t];
            if (!group?.length) return null;
            return (
              <div key={t} className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={14} className="text-neon-cyan" />
                  <span className={TIER_CLASS[t]}>{t}</span>
                  <span className="text-text-secondary text-xs ml-1">({group.length} participants)</span>
                </div>
                <TierTable rows={group} myUid={participant?.uid} />
              </div>
            );
          })}
        </div>

      ) : (

        /* ── Overall / College table ── */
        <div className="card space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
            <input
              className="input-field pl-9 py-2 text-xs"
              placeholder={tab === 'college' ? `Search ${participant?.college ?? 'college'} participants…` : 'Search by name, ID, or college…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {searched.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={40} className="text-neon-cyan/20 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">
                {tab === 'college' ? 'No other participants from your college yet.' : 'No results found.'}
              </p>
            </div>
          ) : (
            <FullTable rows={searched} myUid={participant?.uid} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Full leaderboard table ── */
function FullTable({ rows, myUid }: { rows: LeaderRow[]; myUid?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-body min-w-[600px]">
        <thead>
          <tr className="border-b border-neon-cyan/10">
            {['Rank', 'Participant', 'College', 'Rating', 'Tier', 'Contests', 'Badges'].map(h => (
              <th key={h} className="text-left py-2.5 px-3 text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map(r => {
            const isMe = r.uid === myUid;
            return (
              <tr key={r.uid}
                className={`transition-colors ${isMe
                  ? 'bg-neon-cyan/5 border-l-2 border-l-neon-cyan'
                  : 'hover:bg-white/5'
                }`}>
                <td className="py-3 px-3">
                  <RankBadge rank={r.rank} />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                      <span className="font-heading text-[11px] text-neon-cyan font-bold">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className={`flex items-center gap-1.5 ${isMe ? 'text-neon-cyan' : 'text-white'} font-medium`}>
                        {r.name} {isMe && <span className="text-[10px] text-neon-cyan/70">(you)</span>}
                        {r.foundingMember && (
                          <span title="Founding Member" className="text-gold"><Crown size={11} /></span>
                        )}
                      </div>
                      <div className="text-text-secondary/60 text-[10px] font-numbers">{r.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-text-secondary">
                  <div>{r.college}</div>
                  <div className="text-[10px] text-text-secondary/50">{r.branch} · {r.year}</div>
                </td>
                <td className="py-3 px-3 font-numbers font-bold text-neon-cyan">{r.rating}</td>
                <td className="py-3 px-3">
                  <span className={TIER_CLASS[r.tier]}>{r.tier}</span>
                </td>
                <td className="py-3 px-3 font-numbers text-text-secondary">{r.contests}</td>
                <td className="py-3 px-3 font-numbers text-text-secondary">{r.badges}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Compact tier table ── */
function TierTable({ rows, myUid }: { rows: LeaderRow[]; myUid?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-body min-w-[400px]">
        <thead>
          <tr className="border-b border-neon-cyan/10">
            {['Rank', 'Participant', 'College', 'Rating', 'Contests'].map(h => (
              <th key={h} className="text-left py-2 px-3 text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r, i) => {
            const isMe = r.uid === myUid;
            return (
              <tr key={r.uid} className={`transition-colors ${isMe ? 'bg-neon-cyan/5' : 'hover:bg-white/5'}`}>
                <td className="py-2.5 px-3"><RankBadge rank={i + 1} /></td>
                <td className="py-2.5 px-3">
                  <div className={`flex items-center gap-1.5 ${isMe ? 'text-neon-cyan' : 'text-white'} font-medium`}>
                    {r.name} {isMe && <span className="text-[10px] text-neon-cyan/70">(you)</span>}
                    {r.foundingMember && (
                      <span title="Founding Member" className="text-gold"><Crown size={11} /></span>
                    )}
                  </div>
                  <div className="text-text-secondary/60 text-[10px]">{r.id}</div>
                </td>
                <td className="py-2.5 px-3 text-text-secondary text-[11px]">{r.college}</td>
                <td className="py-2.5 px-3 font-numbers font-bold text-neon-cyan">{r.rating}</td>
                <td className="py-2.5 px-3 font-numbers text-text-secondary">{r.contests}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
