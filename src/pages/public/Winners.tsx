import { Link } from 'react-router-dom';
import { Trophy, Calendar, Zap } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';

interface MonthlyWinner {
  rank: 1 | 2 | 3;
  name: string;
  college: string;
  leaguePoints: number;
  prize: number;
}

interface MonthResult {
  month: string;          // e.g. "August 2026"
  contestsPlayed: number; // Saturday contests counted toward this month
  winners: MonthlyWinner[];
}

// Prepend next month's result here once it's decided — most recent first.
// Source: leaderboard sorted by monthly_points (desc), tie-break by rating.
const MONTHLY_RESULTS: MonthResult[] = [
  {
    month: 'August 2026',
    contestsPlayed: 5,
    winners: [
      { rank: 1, name: 'Apuri Thanuja',               college: 'BVRIT', leaguePoints: 484, prize: 3000 },
      { rank: 2, name: 'Kasa Venkata Niranjan Reddy',  college: 'BVRIT', leaguePoints: 462, prize: 2000 },
      { rank: 3, name: 'Pabboju Muniprasad',           college: 'BVRIT', leaguePoints: 409, prize: 1000 },
    ],
  },
];

const MEDAL: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_LABEL: Record<1 | 2 | 3, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' };
const RANK_BORDER: Record<1 | 2 | 3, string> = { 1: 'border-gold/30', 2: 'border-silver/20', 3: 'border-bronze/20' };
const RANK_TEXT:   Record<1 | 2 | 3, string> = { 1: 'text-gold',      2: 'text-silver',      3: 'text-bronze' };
// Full literal class strings — Tailwind's scanner needs these to appear
// verbatim in the source, not built up with string concatenation.
const RANK_ORDER:  Record<1 | 2 | 3, string> = { 1: 'sm:order-2',     2: 'sm:order-1',       3: 'sm:order-3' };

export default function Winners() {
  const latest = MONTHLY_RESULTS[0];

  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CBBLogo size={60} glow={false} />
          </div>
          <h1 className="heading-lg mb-3">Monthly Winners</h1>
          <p className="text-text-secondary text-sm">CWCL Season 2026–27</p>
        </div>

        {/* Latest month's results */}
        {latest && (
          <div className="card border-neon-cyan/30 py-10 px-6 sm:px-8 mb-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto mb-5">
                <Trophy size={28} className="text-neon-cyan" />
              </div>
              <h2 className="heading-sm mb-2">{latest.month} Champions</h2>
              <p className="text-text-secondary text-xs">
                Ranked by League Points across {latest.contestsPlayed} contests this month
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-center gap-4">
              {latest.winners.map(w => (
                <div
                  key={w.rank}
                  className={`card text-center flex-1 ${RANK_BORDER[w.rank]} ${RANK_ORDER[w.rank]} ${w.rank === 1 ? 'sm:py-6' : ''}`}
                  style={w.rank === 1 ? { boxShadow: '0 0 20px rgba(244,196,48,0.1)' } : undefined}
                >
                  <div className={w.rank === 1 ? 'text-4xl mb-2' : 'text-3xl mb-2'}>{MEDAL[w.rank]}</div>
                  <div className={`font-heading text-sm font-bold ${RANK_TEXT[w.rank]}`}>{RANK_LABEL[w.rank]}</div>
                  <div className="font-heading text-white text-sm font-bold mt-2 leading-tight">{w.name}</div>
                  <div className="text-text-secondary text-[11px] mt-0.5">{w.college}</div>
                  <div className="text-text-secondary text-[11px] mt-1">{w.leaguePoints} LP</div>
                  <div className={`font-numbers font-bold mt-2 ${w.rank === 1 ? 'text-2xl' : 'text-xl'} ${RANK_TEXT[w.rank]}`}>
                    ₹{w.prize.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next month */}
        <div className="card border-electric-blue/20 text-center py-6 px-6 mb-6">
          <div className="flex items-center justify-center gap-2 text-text-secondary/60 text-xs font-body">
            <Calendar size={12} />
            September winners are announced after the September 26 contest concludes.
          </div>
          <Link to="/schedule" className="btn-primary inline-flex items-center gap-2 text-xs px-6 mt-4">
            <Zap size={13} /> View Full Schedule
          </Link>
        </div>

        {/* How winners are decided */}
        <div className="card border-electric-blue/20">
          <h3 className="heading-sm mb-4">How Monthly Winners Are Decided</h3>
          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <div className="flex gap-2"><span className="text-neon-cyan shrink-0">→</span> Every Saturday contest earns you League Points based on your rank.</div>
            <div className="flex gap-2"><span className="text-neon-cyan shrink-0">→</span> 1st = 100 LP, 2nd = 95 LP, 3rd = 90 LP … Participation = 10 LP.</div>
            <div className="flex gap-2"><span className="text-neon-cyan shrink-0">→</span> Monthly winners are the top 3 cumulative LP earners for that month.</div>
            <div className="flex gap-2"><span className="text-neon-cyan shrink-0">→</span> Tie-breakers: total score, then lower penalty.</div>
            <div className="flex gap-2"><span className="text-neon-cyan shrink-0">→</span> Prizes distributed within 7 days of month end.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
