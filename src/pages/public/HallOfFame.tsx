import { Link } from 'react-router-dom';
import { Crown, Star, Calendar, Zap } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';

const AWARDS = [
  { emoji: '🏆', title: 'Season Champion',        desc: 'Highest cumulative League Points across the entire season.' },
  { emoji: '🥈', title: 'Runner-up',              desc: '2nd highest LP at the end of the season.' },
  { emoji: '🥉', title: 'Second Runner-up',       desc: '3rd highest LP at the end of the season.' },
  { emoji: '⚡', title: 'Highest Rated',          desc: 'Participant who reaches the highest rating during the season.' },
  { emoji: '💎', title: 'Most Consistent',        desc: 'Highest contest attendance percentage across the full season.' },
  { emoji: '🔥', title: 'Maximum Participation', desc: 'Participated in the most contests out of all 48 rounds.' },
];

export default function HallOfFame() {
  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown size={24} className="text-gold" />
            <CBBLogo size={56} glow={false} />
            <Crown size={24} className="text-gold" />
          </div>
          <h1 className="heading-lg mb-3">Hall of Fame</h1>
          <p className="text-text-secondary text-sm">CWCL Season 2026–27 · Annual Champions</p>
        </div>

        {/* Season not started */}
        <div className="card border-gold/20 text-center py-12 px-8 mb-8" style={{ boxShadow: '0 0 30px rgba(244,196,48,0.06)' }}>
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-5">
            <Star size={28} className="text-gold" />
          </div>
          <h2 className="heading-sm mb-3">Building Legends</h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-lg mx-auto mb-6">
            The Hall of Fame is empty because Season 2026–27 hasn't started yet.
            After the season ends in August 2027, the greatest performers will be permanently
            immortalized here — just like ICPC, Codeforces, and LeetCode honour their champions.
          </p>
          <div className="flex items-center justify-center gap-2 text-text-secondary/60 text-xs font-body mb-6">
            <Calendar size={12} />
            Season runs August 1, 2026 – August 28, 2027 · 48 Contests
          </div>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-xs px-6">
            <Zap size={13} /> Register Now — Write Your Story
          </Link>
        </div>

        {/* Awards preview */}
        <div>
          <h2 className="heading-sm text-center mb-6">Awards This Season</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AWARDS.map(({ emoji, title, desc }) => (
              <div key={title} className="card text-center hover:border-gold/30 transition-all">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-heading text-white text-xs font-bold uppercase tracking-wide mb-2">{title}</h3>
                <p className="text-text-secondary text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inspiration */}
        <div className="card mt-6 border-neon-cyan/20 text-center py-8">
          <p className="font-heading text-neon-cyan text-sm tracking-[0.2em] uppercase">
            Code Every Saturday. Rise Every Month.
          </p>
          <p className="text-text-secondary text-xs mt-2">
            Your name could be here. Season starts August 1, 2026.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link to="/register" className="btn-primary text-xs px-5 py-2">Register Free</Link>
            <Link to="/schedule" className="btn-secondary text-xs px-5 py-2">View Schedule</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
