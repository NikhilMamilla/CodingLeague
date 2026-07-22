import { Link } from 'react-router-dom';
import { Image, Calendar, Zap } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';
import { SOCIALS } from '../../components/ui/SocialIcons';

const UPCOMING = [
  { emoji: '📸', label: 'Contest Snapshots',    desc: 'Photos from every Saturday contest — online and offline.' },
  { emoji: '🏆', label: 'Prize Ceremonies',     desc: 'Monthly winner celebrations and award moments.' },
  { emoji: '🎓', label: 'Offline Contests',     desc: 'Action shots from BVRIT campus rounds.' },
  { emoji: '👥', label: 'Team & Community',     desc: 'Coding Brigade BVRIT and CSI BVRIT events.' },
  { emoji: '📊', label: 'Highlights & Reels',   desc: 'Season highlights, top performer spotlights.' },
  { emoji: '🎖️', label: 'Certificate Moments',  desc: 'Participants receiving their CWCL certificates.' },
];

export default function Gallery() {
  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CBBLogo size={60} glow={false} />
          </div>
          <h1 className="heading-lg mb-3">Gallery</h1>
          <p className="text-text-secondary text-sm">Photos, videos, and highlights from CWCL events.</p>
        </div>

        {/* Coming soon */}
        <div className="card border-neon-cyan/30 text-center py-14 px-8 mb-8">
          <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto mb-5">
            <Image size={28} className="text-neon-cyan" />
          </div>
          <h2 className="heading-sm mb-3">Gallery Opens After First Contest</h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-lg mx-auto mb-6">
            No photos yet — because the adventure hasn't started. Once the first contest kicks off on
            <span className="text-neon-cyan font-semibold"> August 1, 2026</span>, this gallery
            will fill up with contest moments, winner celebrations, and memories from every Saturday.
          </p>
          <div className="flex items-center justify-center gap-2 text-text-secondary/60 text-xs font-body mb-6">
            <Calendar size={12} />
            First contest: Saturday, August 1, 2026 · CWCL Season 2026–27
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link to="/register" className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5">
              <Zap size={12} /> Be Part of It
            </Link>
            <Link to="/schedule" className="btn-secondary text-xs px-5 py-2">
              View Schedule
            </Link>
          </div>
        </div>

        {/* What's coming */}
        <div>
          <h2 className="heading-sm text-center mb-6">What You'll See Here</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {UPCOMING.map(({ emoji, label, desc }) => (
              <div key={label} className="card hover:border-neon-cyan/40 transition-all">
                <div className="text-2xl mb-3">{emoji}</div>
                <h3 className="font-heading text-white text-xs font-bold uppercase tracking-wide mb-1.5">{label}</h3>
                <p className="text-text-secondary text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Follow CTA */}
        <div className="card mt-6 border-electric-blue/20 text-center py-8">
          <p className="text-text-secondary text-sm mb-5">
            Follow us on social media for real-time updates from every contest.
          </p>
          <div className="flex items-center justify-center gap-5">
            {SOCIALS.filter(s => ['Instagram', 'LinkedIn', 'X'].includes(s.label)).map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
