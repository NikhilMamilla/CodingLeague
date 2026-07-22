import { Link } from 'react-router-dom';
import { Trophy, Calendar, Zap } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';

export default function Winners() {
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

        {/* Season not started card */}
        <div className="card border-neon-cyan/30 text-center py-14 px-8">
          <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto mb-6">
            <Trophy size={28} className="text-neon-cyan" />
          </div>
          <h2 className="heading-sm mb-3">Season Hasn't Started Yet</h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto mb-6">
            Monthly winners will be announced here after each month's contests are completed.
            The first contest kicks off on <span className="text-neon-cyan font-semibold">August 1, 2026</span>.
            Top 3 League Point earners each month win cash prizes.
          </p>

          {/* Prize preview */}
          <div className="flex items-end justify-center gap-4 mb-8">
            <div className="card text-center px-6 py-4 border-silver/20">
              <div className="text-3xl mb-2">🥈</div>
              <div className="font-heading text-silver text-sm font-bold">2nd Place</div>
              <div className="font-numbers text-xl font-bold text-silver mt-1">₹2,000</div>
            </div>
            <div className="card text-center px-6 py-6 border-gold/30" style={{ boxShadow: '0 0 20px rgba(244,196,48,0.1)' }}>
              <div className="text-4xl mb-2">🥇</div>
              <div className="font-heading text-gold text-base font-bold">1st Place</div>
              <div className="font-numbers text-2xl font-bold text-gold mt-1">₹3,000</div>
            </div>
            <div className="card text-center px-6 py-4 border-bronze/20">
              <div className="text-3xl mb-2">🥉</div>
              <div className="font-heading text-bronze text-sm font-bold">3rd Place</div>
              <div className="font-numbers text-xl font-bold text-bronze mt-1">₹1,000</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-text-secondary/60 text-xs font-body mb-6">
            <Calendar size={12} />
            First contest: Saturday, August 1, 2026
          </div>

          <Link to="/schedule" className="btn-primary inline-flex items-center gap-2 text-xs px-6">
            <Zap size={13} /> View Full Schedule
          </Link>
        </div>

        {/* How winners are decided */}
        <div className="card mt-6 border-electric-blue/20">
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
