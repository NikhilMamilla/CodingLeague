import { Target, Users, Award, Code, CheckCircle } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';
import { SOCIALS } from '../../components/ui/SocialIcons';

const CORE_VALUES = [
  { icon: CheckCircle, title: 'Consistency Over Talent',        desc: 'League Points reward participation. Miss a contest and you fall behind.' },
  { icon: Users,       title: 'Community First',                desc: 'Students from all colleges compete together and grow together.' },
  { icon: Award,       title: 'Recognition Through Performance', desc: 'Monthly cash prizes, certificates, and a permanent Hall of Fame.' },
  { icon: Code,        title: 'Professional Experience',        desc: 'A platform built to feel like Codeforces, not a college event website.' },
];

const STATS = [
  { value: 'Aug 2026', label: 'Season Launch'  },
  { value: '40+',      label: 'Contests/Year'  },
  { value: '50+',      label: 'Colleges'        },
  { value: 'Rs.72K',   label: 'Annual Prizes'  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-midnight pt-20 pb-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-16">

        {/* ── Hero ── */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CBBLogo size={72} glow={false} />
          </div>
          <h1 className="heading-lg">About CWCL</h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-2xl mx-auto">
            The CBB Weekly Coding League is a full-season competitive programming league
            organized by Coding Brigade BVRIT and CSI BVRIT. We bring the spirit of
            professional sports leagues to college coding — compete every Saturday, earn
            points, and rise every month.
          </p>
        </div>

        {/* ── What is CWCL ── */}
        <div className="card-glow space-y-4">
          <div className="flex items-center gap-3">
            <Target size={18} className="text-neon-cyan shrink-0" />
            <h2 className="heading-sm">What is CWCL?</h2>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">
            Unlike one-time hackathons, CWCL runs like a league — every Saturday, every
            month, all year. Every participant gets a permanent CWCL ID, a rating that
            evolves with their performance, and a profile that tracks their entire journey
            across the season.
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            We use a League Points system inspired by professional sports: your weekly
            rank earns you points, and monthly champions are decided by consistency — not
            just one exceptional performance. This encourages students to show up every
            single Saturday.
          </p>
        </div>

        {/* ── Core Values ── */}
        <div>
          <h2 className="heading-sm text-center mb-8">Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {CORE_VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card flex gap-4 items-start">
                <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-neon-cyan" />
                </div>
                <div>
                  <div className="text-white text-xs font-heading font-bold mb-1 uppercase tracking-wide">{title}</div>
                  <div className="text-text-secondary text-xs leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Organized By ── */}
        <div>
          <h2 className="heading-sm text-center mb-8">Organized By</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* CBB */}
            <div className="card text-center flex flex-col items-center gap-4">
              <CBBLogo size={72} glow={false} />
              <div>
                <h3 className="font-heading text-neon-cyan text-xs font-bold tracking-widest uppercase mb-1">
                  Coding Brigade BVRIT
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  The premier competitive programming club at BVRIT, building coding
                  culture and preparing students for national competitions.
                </p>
              </div>
            </div>

            {/* CSI */}
            <div className="card text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <img
                  src="/CSI.png"
                  alt="CSI BVRIT"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h3 className="font-heading text-electric-blue text-xs font-bold tracking-widest uppercase mb-1">
                  CSI BVRIT
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Computer Society of India student chapter at BVRIT, supporting
                  technical events and industry-bridging initiatives.
                </p>
              </div>
            </div>

            {/* BVRIT */}
            <div className="card text-center flex flex-col items-center gap-4">
              <div className="w-24 h-16 flex items-center justify-center">
                <img
                  src="/BVRIT.png"
                  alt="BVRIT"
                  className="w-full h-full object-contain"
                  style={{ maxWidth: '140px', maxHeight: '64px' }}
                />
              </div>
              <div>
                <h3 className="font-heading text-neon-cyan text-xs font-bold tracking-widest uppercase mb-1">
                  BVRIT
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  B V Raju Institute of Technology — the home campus of CWCL, hosting
                  offline contests and supporting the league infrastructure.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="card text-center">
              <div className="stat-number text-xl md:text-2xl">{value}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1 font-body">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tagline banner ── */}
        <div className="card border-neon-cyan/30 text-center py-8">
          <p className="font-heading text-neon-cyan text-sm md:text-base tracking-[0.3em] uppercase">
            Code Every Saturday. Rise Every Month.
          </p>
          <p className="text-text-secondary text-xs mt-2">
            Coding Brigade BVRIT x CSI BVRIT — Season 2026-27
          </p>
          {/* Social icons only — no text */}
          <div className="flex items-center justify-center gap-4 mt-5">
            {SOCIALS.map(({ label, href, Icon }) => (
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
