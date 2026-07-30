import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Trophy, ChevronRight, Calendar, Users, Star, Award, TrendingUp, Shield } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';
import { SOCIALS } from '../../components/ui/SocialIcons';

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="card group hover:border-neon-cyan/50 transition-all h-full flex flex-col">
      <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-3 group-hover:bg-neon-cyan/20 transition-colors">
        <Icon size={18} className="text-neon-cyan" />
      </div>
      <h3 className="font-heading text-white text-xs font-bold uppercase tracking-wide mb-1.5">{title}</h3>
      <p className="text-text-secondary text-xs leading-relaxed flex-1">{desc}</p>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="relative card hover:border-neon-cyan/40 transition-all flex flex-col">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-neon-cyan text-midnight rounded-full flex items-center justify-center font-heading text-[10px] font-bold">
        {step}
      </div>
      <h3 className="font-heading text-white text-xs font-bold uppercase tracking-wide mb-2 mt-1">{title}</h3>
      <p className="text-text-secondary text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-midnight">

      {/* ══ SECTION 1 — HERO ══ */}
      <section className="min-h-screen flex items-center overflow-hidden bg-grid pt-16 pb-6 px-4 md:px-12">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-electric-blue/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center lg:grid lg:grid-cols-2 lg:items-center gap-4 lg:gap-16">

            {/* Mobile: logo centered — smaller to save space */}
            <div className="flex lg:hidden justify-center">
              <CBBLogo glow={false} size={140} className="w-36 h-36 animate-float" />
            </div>

            {/* Text block */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left w-full gap-3 lg:gap-5">
              <div className="inline-flex items-center gap-1.5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-full px-3 py-1">
                <Zap size={9} className="text-neon-cyan" />
                <span className="font-heading text-[8px] sm:text-[9px] text-neon-cyan tracking-widest uppercase">
                  Season 2026–27 · Registrations Open
                </span>
              </div>

              <h1 className="font-heading font-bold uppercase leading-tight w-full">
                <span className="heading-xl block text-[1.75rem] sm:text-5xl lg:text-6xl xl:text-7xl">CBB Weekly</span>
                <span className="heading-xl block text-[1.75rem] sm:text-5xl lg:text-6xl xl:text-7xl">Coding League</span>
              </h1>

              <p className="font-heading text-[9px] sm:text-xs text-text-secondary tracking-[0.18em] uppercase">
                Code Every Saturday. Rise Every Month.
              </p>

              {/* Inline stats */}
              <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center lg:justify-start">
                {[
                  { v: '2000+', l: 'Students' },
                  { v: '50+',   l: 'Colleges'  },
                  { v: '40+',   l: 'Contests'  },
                  { v: '₹72K+', l: 'Prizes'    },
                ].map(({ v, l }) => (
                  <div key={l} className="text-center lg:text-left">
                    <div className="stat-number text-lg sm:text-2xl font-bold">{v}</div>
                    <div className="text-text-secondary/60 text-[9px] uppercase tracking-wider font-body">{l}</div>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-row items-center justify-center lg:justify-start gap-2 w-full sm:w-auto">
                <Link to="/register" className="btn-primary   text-[10px] sm:text-sm px-4 sm:px-8 py-2">Register Now</Link>
                <Link to="/login"    className="btn-secondary text-[10px] sm:text-sm px-4 sm:px-8 py-2">Login</Link>
              </div>


              {/* Social icons */}
              <div className="flex items-center gap-3 justify-center lg:justify-start mt-1">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop logo */}
            <div className="hidden lg:flex items-center justify-end">
              <CBBLogo glow={false} size={460} className="animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2 — HOW IT WORKS ══ */}
      <section className="min-h-screen flex items-center bg-navy/30 py-16 px-4 md:px-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div className="space-y-6">
              <div>
                <p className="text-neon-cyan font-heading text-[10px] tracking-widest uppercase mb-2">The Format</p>
                <h2 className="heading-lg mb-3">Not a Hackathon. A League.</h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  CWCL runs every Saturday for an entire academic year. You earn League Points
                  based on your weekly rank. The more you show up, the higher you climb.
                  This is competitive programming the way it should be.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: TrendingUp, title: 'Cumulative Rankings',  desc: 'Monthly standings are total League Points all month — not just one contest.' },
                  { icon: Shield,     title: 'Fair & Transparent',   desc: 'Results imported by admins after each contest. Leaderboards update automatically.' },
                  { icon: Award,      title: 'Multiple Platforms',   desc: 'HackerRank, Codeforces, CodeChef and more — platform announced before each event.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} className="text-neon-cyan" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-heading font-bold uppercase tracking-wide mb-0.5">{title}</div>
                      <div className="text-text-secondary text-xs leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/about" className="inline-flex items-center gap-1.5 text-neon-cyan text-xs font-heading uppercase tracking-widest hover:gap-2.5 transition-all">
                Learn More <ChevronRight size={11} />
              </Link>
            </div>

            {/* Right: 4 steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <StepCard step="01" title="Register Once"    desc="Permanent CWCL ID, a rating profile, and access to every contest in the season." />
              <StepCard step="02" title="Compete Saturday" desc="Every Saturday — HackerRank / Codeforces / CodeChef or offline at BVRIT. Platform announced in advance." />
              <StepCard step="03" title="Earn Points"      desc="Top ranks earn up to 100 LP. Participation alone earns 10 LP. Consistency wins." />
              <StepCard step="04" title="Win Monthly"      desc="Cumulative LP decides monthly champions. Top 3 earn cash prizes." />
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 — FEATURES ══ */}
      <section className="min-h-screen flex items-center py-16 px-4 md:px-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-10">
            <p className="text-neon-cyan font-heading text-[10px] tracking-widest uppercase mb-2">What You Get</p>
            <h2 className="heading-lg mb-3">Platform Features</h2>
            <p className="text-text-secondary text-sm max-w-lg mx-auto leading-relaxed">
              A fully-featured competitive coding platform built for serious programmers.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={TrendingUp} title="Elo Rating System"   desc="Start at 800. Every contest changes your rating based on rank vs expected performance. Beginner to Grandmaster." />
            <FeatureCard icon={Calendar}   title="40+ Contests / Year" desc="Full season from August to May. Online and Offline every Saturday with advance platform announcements." />
            <FeatureCard icon={Users}      title="College Leaderboard" desc="Individual rankings plus your college's standing. Compete for yourself and represent your institution." />
            <FeatureCard icon={Star}       title="Badges & Streaks"    desc="Earn badges for key milestones — 10 contests, first win, perfect score, 6-month streak, monthly title." />
            <FeatureCard icon={Trophy}     title="Hall of Fame"        desc="Season champions, highest-rated, most consistent — permanently recorded for every year." />
            <FeatureCard icon={Award}      title="Auto Certificates"   desc="PDF certificates auto-generated for every participation, win, monthly title, and annual championship." />
          </div>
        </div>
      </section>

      {/* ══ SECTION 4 — PRIZES + CTA ══ */}
      <section className="min-h-screen flex items-center bg-navy/30 py-16 px-4 md:px-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Prizes */}
            <div>
              <p className="text-neon-cyan font-heading text-[10px] tracking-widest uppercase mb-2">Monthly Rewards</p>
              <h2 className="heading-lg mb-3">Cash Prizes Every Month</h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">
                Top 3 League Point earners each month win cash. Distributed within 7 days of month end.
                Consistency is rewarded — not just one great performance.
              </p>
              <div className="space-y-3">
                {[
                  { rank: '1st Place', emoji: '🥇', amount: '₹3,000', color: 'text-gold',   border: 'border-gold/30' },
                  { rank: '2nd Place', emoji: '🥈', amount: '₹2,000', color: 'text-silver', border: 'border-silver/20' },
                  { rank: '3rd Place', emoji: '🥉', amount: '₹1,000', color: 'text-bronze', border: 'border-bronze/20' },
                ].map(({ rank, emoji, amount, color, border }) => (
                  <div key={rank} className={`card flex items-center justify-between ${border} hover:border-neon-cyan/30 transition-all`}>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <div className={`font-heading text-sm font-bold ${color}`}>{rank}</div>
                        <div className="text-text-secondary/50 text-[10px] font-body">Monthly Champion</div>
                      </div>
                    </div>
                    <div className={`font-numbers text-2xl font-bold ${color}`}>{amount}</div>
                  </div>
                ))}
              </div>
              <p className="text-text-secondary/40 text-xs mt-3 font-body">
                Based on League Points. Tie-breaker: total score, then penalty.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center text-center gap-6">
              <CBBLogo size={100} glow={false} className="opacity-90" />
              <div>
                <h3 className="heading-md mb-2">Ready to Compete?</h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
                  Join 2000+ students from 50+ colleges. One registration. A full year of coding.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Link to="/register" className="btn-primary py-3 px-8 w-full text-center">Register</Link>
                <Link to="/schedule" className="btn-secondary py-3 px-6 w-full text-center text-xs">Schedule</Link>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary/60 font-body w-full max-w-xs">
                {['No Entry Fee', 'One-time Sign Up', 'All Colleges Welcome', 'Monthly Cash Prizes'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="text-success text-xs">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
