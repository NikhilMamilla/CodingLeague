import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, TrendingUp, Search, Medal, Crown, Star, Calendar, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getParticipants, getAllResults, getContests, getResultsByContest } from '../../lib/db';
import type { Contest, ContestResult } from '../../types';
const TIER_CLASS: Record<string, string> = {
  Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
  Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
};

const TIER_ORDER = ['Grandmaster', 'Master', 'Expert', 'Coder', 'Explorer', 'Beginner'];

type Tab = 'overall' | 'tier' | 'college' | 'contest';

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
  monthlyPoints: number;
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

  // Contest leaderboard state
  const [completedContests,   setCompletedContests]   = useState<Contest[]>([]);
  const [selectedContestId,   setSelectedContestId]   = useState<string>('');
  const [contestResults,      setContestResults]      = useState<ContestResult[]>([]);
  const [contestResultsLoading, setContestResultsLoading] = useState(false);

  useEffect(() => {
    getParticipants(0).then(data => {
      setRows(data
        .filter(p => p.role !== 'admin' && p.role !== 'super_admin')
        .map((p, i) => ({
          rank: i + 1, uid: p.uid, name: p.fullName, id: p.participantId,
          college: p.college, branch: p.branch, year: p.year,
          rating: p.rating, tier: p.tier, contests: p.contestsParticipated,
          attendance: p.attendance ?? 0, badges: p.badges?.length ?? 0,
          monthlyPoints: p.monthlyPoints ?? 0,
          foundingMember: p.foundingMember,
        })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Build a per-participant contest count from the results table.
    // This is used as the primary count; contestsParticipated on the
    // participant record is used as fallback (see rowsWithActualContests).
    getAllResults().then(results => {
      const map: Record<string, Set<string>> = {};
      results.forEach(r => {
        if (!r.participantId || !r.contestId) return;
        // Trim to guard against any whitespace mismatches
        const pid = r.participantId.trim();
        map[pid] ??= new Set();
        map[pid].add(r.contestId);
      });
      setContestCounts(
        Object.fromEntries(Object.entries(map).map(([id, s]) => [id, s.size]))
      );
    }).catch(() => {
      // Non-critical — rows will fall back to contestsParticipated
    });
  }, []);

  // Load completed contests for the contest tab
  useEffect(() => {
    getContests().then(all => {
      const completed = all.filter(c => c.status === 'Completed')
        .sort((a, b) => (a.contestNumber ?? 0) - (b.contestNumber ?? 0));
      setCompletedContests(completed);
      if (completed.length > 0) setSelectedContestId(completed[completed.length - 1].id);
    }).catch(() => {});
  }, []);

  // Load results whenever selected contest changes
  useEffect(() => {
    if (!selectedContestId) return;
    setContestResultsLoading(true);
    getResultsByContest(selectedContestId)
      .then(results => {
        setContestResults(results.sort((a, b) => a.rank - b.rank));
        setContestResultsLoading(false);
      })
      .catch(() => setContestResultsLoading(false));
  }, [selectedContestId]);

  const rowsWithActualContests = rows.map(r => ({
    ...r,
    // Use contestCounts from results table if available, fall back to
    // contestsParticipated stored on the participant record itself.
    contests: contestCounts[r.id] > 0
      ? contestCounts[r.id]
      : (r.contests ?? 0),
  }));

  const myContestCount = participant
    ? (contestCounts[participant.participantId] > 0
        ? contestCounts[participant.participantId]
        : (participant.contestsParticipated ?? 0))
    : 0;

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
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit flex-wrap">
        {([
          { key: 'overall', label: 'Overall',    icon: Trophy    },
          { key: 'contest', label: 'By Contest', icon: Calendar  },
          { key: 'college', label: 'My College', icon: Medal     },
          { key: 'tier',    label: 'By Tier',    icon: Crown     },
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
      ) : tab === 'contest' ? (

        /* ── Contest Leaderboard ── */
        <div className="space-y-4">
          {/* Contest selector */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Calendar size={14} className="text-neon-cyan" />
                <span className="text-xs text-white font-medium">Select Contest:</span>
              </div>
              {completedContests.length === 0 ? (
                <span className="text-text-secondary text-xs italic">No completed contests yet.</span>
              ) : (
                <div className="relative flex-1 max-w-sm">
                  <select
                    value={selectedContestId}
                    onChange={e => setSelectedContestId(e.target.value)}
                    className="input-field text-xs pr-8 appearance-none cursor-pointer"
                  >
                    {completedContests.map(c => (
                      <option key={c.id} value={c.id}>
                        Contest #{c.contestNumber} — {c.name} ({c.date})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Contest results table */}
          {completedContests.length > 0 && (
            <div className="card">
              {(() => {
                const selectedContest = completedContests.find(c => c.id === selectedContestId);
                return selectedContest ? (
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h2 className="font-heading text-white text-sm font-bold">{selectedContest.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-text-secondary/60">{selectedContest.date}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success">
                          ✓ Completed
                        </span>
                        <span className="text-[10px] text-text-secondary/50">
                          {selectedContest.mode} · {selectedContest.platform ?? selectedContest.venue ?? ''}
                        </span>
                        <span className="text-[10px] text-text-secondary/50">
                          Week {selectedContest.weekNumber}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-text-secondary/50 font-numbers">
                      {contestResults.length} participants
                    </span>
                  </div>
                ) : null;
              })()}

              {contestResultsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
                </div>
              ) : contestResults.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={36} className="text-neon-cyan/20 mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">No results published for this contest yet.</p>
                </div>
              ) : (
                <ContestResultsTable
                  results={contestResults}
                  myParticipantId={participant?.participantId}
                  participantNameMap={Object.fromEntries(rows.map(r => [r.id, r.name]))}
                />
              )}
            </div>
          )}
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

/* ── Contest Results Table ── */
function ContestResultsTable({ results, myParticipantId, participantNameMap }: {
  results: ContestResult[];
  myParticipantId?: string;
  participantNameMap: Record<string, string>; // participantId → fullName
}) {
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageRows = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body min-w-[560px]">
          <thead>
            <tr className="border-b border-neon-cyan/10">
              {['Rank', 'Participant', 'College', 'Score', 'Problems', 'Penalty', 'LP', 'Rating Δ'].map(h => (
                <th key={h} className="text-left py-2.5 px-3 text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pageRows.map(r => {
              const isMe  = r.participantId === myParticipantId;
              const delta = r.ratingAfter - r.ratingBefore;
              // Real full name from participants table (if matched), else fall back to stored name
              const realName = participantNameMap[r.participantId?.trim()] || null;
              // The stored participantName might be a HackerRank username — show it as the platform ID
              const displayName = realName || r.participantName;
              const platformId  = realName && realName !== r.participantName ? r.participantName : null;

              return (
                <tr key={r.id}
                  className={`transition-colors ${
                    isMe ? 'bg-neon-cyan/5 border-l-2 border-l-neon-cyan' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3">
                    {r.rank === 1 ? <span className="text-xl">🥇</span>
                      : r.rank === 2 ? <span className="text-xl">🥈</span>
                      : r.rank === 3 ? <span className="text-xl">🥉</span>
                      : <span className="text-xs font-numbers text-text-secondary">#{r.rank}</span>}
                  </td>

                  {/* Participant — real name + platform username + CBB ID */}
                  <td className="py-3 px-3">
                    <div className={`font-medium leading-tight ${isMe ? 'text-neon-cyan' : 'text-white'}`}>
                      {displayName}
                      {isMe && <span className="ml-1 text-[10px] text-neon-cyan/70">(you)</span>}
                    </div>
                    {/* HackerRank / platform username if different from real name */}
                    {platformId && (
                      <div className="text-[10px] text-warning/70 font-mono mt-0.5">
                        🎮 {platformId}
                      </div>
                    )}
                    {/* CBB participant ID */}
                    <div className="text-text-secondary/40 text-[10px] font-numbers">{r.participantId}</div>
                  </td>

                  {/* College */}
                  <td className="py-3 px-3 text-text-secondary text-[11px]">{r.college}</td>

                  {/* Score */}
                  <td className="py-3 px-3 font-numbers font-bold text-white">{r.score}</td>

                  {/* Problems */}
                  <td className="py-3 px-3 font-numbers text-neon-cyan">{r.problemsSolved}</td>

                  {/* Penalty */}
                  <td className="py-3 px-3 font-numbers text-text-secondary/60">{r.penalty}</td>

                  {/* League Points */}
                  <td className="py-3 px-3 font-numbers font-bold text-gold">{r.leaguePoints}</td>

                  {/* Rating Delta */}
                  <td className="py-3 px-3 font-numbers">
                    {r.ratingBefore > 0 ? (
                      <span className={delta >= 0 ? 'text-success' : 'text-red-400'}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </span>
                    ) : (
                      <span className="text-text-secondary/30">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white hover:border-neon-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-[11px] text-text-secondary/60 font-numbers">
            Page {page + 1} of {totalPages} · {results.length} participants
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white hover:border-neon-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Full leaderboard table ── */
function FullTable({ rows, myUid }: { rows: LeaderRow[]; myUid?: string }) {
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body min-w-[600px]">
          <thead>
            <tr className="border-b border-neon-cyan/10">
              {['Rank', 'Participant', 'College', 'LP', 'Rating', 'Tier', 'Contests', 'Badges'].map(h => (
                <th key={h} className="text-left py-2.5 px-3 text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pageRows.map((r, i) => {
              const isMe = r.uid === myUid;
              const displayRank = page * PAGE_SIZE + i + 1;
              return (
                <tr key={r.uid}
                  className={`transition-colors ${isMe
                    ? 'bg-neon-cyan/5 border-l-2 border-l-neon-cyan'
                    : 'hover:bg-white/5'
                  }`}>
                  <td className="py-3 px-3">
                    <RankBadge rank={displayRank} />
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
                  <td className="py-3 px-3 font-numbers font-bold text-gold">
                    {r.monthlyPoints > 0 ? r.monthlyPoints : <span className="text-text-secondary/40">—</span>}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white hover:border-neon-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-[11px] text-text-secondary/60 font-numbers">
            Page {page + 1} of {totalPages} · {rows.length} participants
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white hover:border-neon-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
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
            {['Rank', 'Participant', 'College', 'LP', 'Rating', 'Contests'].map(h => (
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
                <td className="py-2.5 px-3 font-numbers font-bold text-gold">
                  {r.monthlyPoints > 0 ? r.monthlyPoints : <span className="text-text-secondary/40">—</span>}
                </td>
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
