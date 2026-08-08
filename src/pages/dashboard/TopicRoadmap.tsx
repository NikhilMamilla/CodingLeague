import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, Clock, ChevronRight,
  ExternalLink, Zap, RotateCcw, Trophy, Star,
  Wifi, MapPin, Calendar,
} from 'lucide-react';
import { WEEK_TOPIC_MAP, PRACTICE_LINKS, MONTH_LABELS } from '../../lib/weekTopics';
import { getContests } from '../../lib/db';
import type { Contest } from '../../types';

const STORAGE_KEY = 'cwcl_topic_progress_v3';

type TopicStatus = 'not-started' | 'practicing' | 'confident';

function loadProgress(): Record<number, TopicStatus> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(p: Record<number, TopicStatus>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

const STATUS_CONFIG: Record<TopicStatus, {
  label: string; color: string; bg: string; icon: typeof Star;
}> = {
  'not-started': { label: 'Not Started', color: 'text-text-secondary', bg: 'bg-white/5 border-white/10',      icon: Clock        },
  'practicing':  { label: 'Practicing',  color: 'text-warning',        bg: 'bg-warning/10 border-warning/30',  icon: Zap          },
  'confident':   { label: 'Confident',   color: 'text-success',        bg: 'bg-success/10 border-success/30',  icon: CheckCircle2 },
};

const NEXT_STATUS: Record<TopicStatus, TopicStatus> = {
  'not-started': 'practicing',
  'practicing':  'confident',
  'confident':   'not-started',
};

export default function TopicRoadmap() {
  const [progress, setProgress]   = useState<Record<number, TopicStatus>>(loadProgress);
  const [contests, setContests]   = useState<Contest[]>([]);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  useEffect(() => { saveProgress(progress); }, [progress]);

  useEffect(() => {
    getContests().then(all => {
      setContests(all);
      const live     = all.find(c => c.status === 'Active');
      const upcoming = all.filter(c => c.status === 'Upcoming')
                          .sort((a, b) => a.date.localeCompare(b.date))[0];
      const ref = live ?? upcoming;
      if (ref?.weekNumber) setActiveWeek(ref.weekNumber);
    }).catch(() => {});
  }, []);

  function cycleStatus(week: number) {
    setProgress(prev => ({ ...prev, [week]: NEXT_STATUS[prev[week] ?? 'not-started'] }));
  }

  function resetAll() {
    if (!confirm('Reset all topic progress? This cannot be undone.')) return;
    setProgress({});
  }

  function getContestForWeek(weekNum: number): Contest | undefined {
    return contests.find(c => c.weekNumber === weekNum);
  }

  // Stats — only count non-grand-test weeks for progress
  const practiceWeeks = WEEK_TOPIC_MAP.filter(w => !w.isGrandTest);
  const confident  = practiceWeeks.filter(w => progress[w.week] === 'confident').length;
  const practicing = practiceWeeks.filter(w => progress[w.week] === 'practicing').length;
  const total      = practiceWeeks.length;

  // Group weeks by month
  const months = [...new Set(WEEK_TOPIC_MAP.map(w => w.month))];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md flex items-center gap-2">
            <BookOpen size={22} className="text-neon-cyan" />
            Topic Roadmap
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            Official CWCL 2026–27 week-wise schedule. Every 4th week is an Offline Monthly Grand Test.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white hover:border-white/20 transition-colors self-start sm:self-auto"
        >
          <RotateCcw size={11} /> Reset Progress
        </button>
      </div>

      {/* Progress Summary — online weeks only */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <div className="stat-number text-2xl text-success">{confident}</div>
          <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mt-0.5">Confident</div>
        </div>
        <div className="card text-center py-4">
          <div className="stat-number text-2xl text-warning">{practicing}</div>
          <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mt-0.5">Practicing</div>
        </div>
        <div className="card text-center py-4">
          <div className="stat-number text-2xl text-text-secondary">{total - confident - practicing}</div>
          <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mt-0.5">Not Started</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-text-secondary/70 uppercase tracking-wider">Topic Preparation</span>
          <span className="text-[11px] font-numbers text-neon-cyan">
            {total > 0 ? Math.round((confident / total) * 100) : 0}% confident
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-warning to-success transition-all duration-700"
            style={{ width: `${total > 0 ? Math.round(((confident + practicing * 0.5) / total) * 100) : 0}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-success"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Confident</span>
          <span className="flex items-center gap-1 text-[10px] text-warning"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> Practicing</span>
          <span className="flex items-center gap-1 text-[10px] text-text-secondary/50"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" /> Not Started</span>
        </div>
      </div>

      {/* Month-grouped timeline */}
      <div className="space-y-8">
        {months.map(monthNum => {
          const monthWeeks = WEEK_TOPIC_MAP.filter(w => w.month === monthNum);
          const monthLabel = MONTH_LABELS[monthNum] ?? `Month ${monthNum}`;

          return (
            <div key={monthNum}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-neon-cyan" />
                </div>
                <h2 className="font-heading text-neon-cyan text-sm font-bold tracking-wide">{monthLabel}</h2>
                <div className="flex-1 h-px bg-neon-cyan/10" />
              </div>

              {/* Week cards */}
              <div className="space-y-2.5 pl-2">
                {monthWeeks.map(w => {
                  const contest       = getContestForWeek(w.week);
                  const isCurrentWeek = w.week === activeWeek;
                  const topicStatus   = progress[w.week] ?? 'not-started';
                  const pCfg          = STATUS_CONFIG[topicStatus];
                  const PIcon         = pCfg.icon;
                  const links         = PRACTICE_LINKS[w.topic];

                  if (w.isGrandTest) {
                    // ── Grand Test card ─────────────────────────────────
                    return (
                      <div key={w.week} className={`relative rounded-xl border-2 border-gold/40 bg-gold/[0.04] p-4 transition-all ${
                        isCurrentWeek ? 'shadow-[0_0_20px_rgba(255,215,0,0.1)]' : ''
                      }`}>
                        {isCurrentWeek && (
                          <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-gold text-midnight text-[9px] font-heading font-bold rounded uppercase tracking-widest">
                            ← Now
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          {/* Week badge */}
                          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-numbers font-bold text-gold leading-none">W{w.week}</span>
                            <span className="text-[8px] text-gold/60 mt-0.5">C{w.week}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-lg">{w.icon}</span>
                              <span className="font-heading font-bold text-gold text-sm">Offline Monthly Grand Test</span>
                              <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold font-bold">
                                <MapPin size={9} /> Offline
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {w.focusAreas.map(f => (
                                <span key={f} className="text-[9px] px-2 py-0.5 rounded-full border bg-gold/5 border-gold/20 text-gold/70">
                                  {f}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gold/60 flex-wrap">
                              <span className="flex items-center gap-1"><Calendar size={9} /> {w.date}</span>
                              {contest && (
                                <span className={`px-1.5 py-0.5 rounded border font-bold text-[9px] ${
                                  contest.status === 'Active'
                                    ? 'bg-success/10 border-success/30 text-success animate-pulse'
                                    : contest.status === 'Upcoming'
                                    ? 'bg-warning/10 border-warning/30 text-warning'
                                    : 'bg-white/5 border-white/10 text-text-secondary/50'
                                }`}>
                                  {contest.status === 'Active' ? '🔴 LIVE' : contest.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ── Regular Online Contest card ──────────────────────
                  return (
                    <div key={w.week} className={`relative rounded-xl border transition-all ${
                      isCurrentWeek
                        ? 'border-neon-cyan/40 bg-neon-cyan/[0.03] shadow-[0_0_20px_rgba(0,229,255,0.06)]'
                        : 'border-white/8 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02]'
                    }`}>
                      {isCurrentWeek && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-neon-cyan text-midnight text-[9px] font-heading font-bold rounded uppercase tracking-widest">
                          ← Current Week
                        </span>
                      )}

                      <div className="flex items-start gap-3 p-4">
                        {/* Week / contest number badge */}
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                          isCurrentWeek
                            ? 'bg-neon-cyan/15 border-neon-cyan/30'
                            : 'bg-white/5 border-white/10'
                        }`}>
                          <span className={`text-xl leading-none`}>{w.icon}</span>
                          <span className={`text-[8px] font-numbers font-bold mt-0.5 ${isCurrentWeek ? 'text-neon-cyan' : 'text-text-secondary/50'}`}>
                            W{w.week}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`font-heading font-bold text-sm ${isCurrentWeek ? 'text-white' : 'text-white/85'}`}>
                              {w.topic}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan/70">
                              <Wifi size={8} /> Online
                            </span>
                            {contest && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                                contest.status === 'Active'
                                  ? 'bg-success/10 border-success/30 text-success animate-pulse'
                                  : contest.status === 'Upcoming'
                                  ? 'bg-warning/10 border-warning/30 text-warning'
                                  : 'bg-white/5 border-white/10 text-text-secondary/40'
                              }`}>
                                {contest.status === 'Active' ? '🔴 LIVE' : contest.status}
                              </span>
                            )}
                          </div>

                          {/* Focus area tags */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {w.focusAreas.map(f => (
                              <span key={f} className={`text-[9px] px-2 py-0.5 rounded-full border ${
                                isCurrentWeek
                                  ? 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan/80'
                                  : 'bg-white/5 border-white/10 text-text-secondary/55'
                              }`}>
                                {f}
                              </span>
                            ))}
                          </div>

                          {/* Date + contest name row */}
                          <div className="flex items-center gap-3 text-[10px] text-text-secondary/50 flex-wrap">
                            <span className="flex items-center gap-1"><Calendar size={9} /> {w.date}</span>
                            {contest && (
                              <span className="text-text-secondary/40 truncate max-w-[200px]">{contest.name}</span>
                            )}
                          </div>
                        </div>

                        {/* Right side: practice links + progress toggle */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {/* Practice links */}
                          {links && (
                            <div className="flex items-center gap-1.5">
                              {links.leetcode && (
                                <a href={links.leetcode} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFA116]/10 border border-[#FFA116]/20 text-[#FFA116] text-[10px] font-medium hover:bg-[#FFA116]/20 transition-colors">
                                  LC <ExternalLink size={9} />
                                </a>
                              )}
                              {links.gfg && (
                                <a href={links.gfg} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2F8D46]/10 border border-[#2F8D46]/20 text-[#2F8D46] text-[10px] font-medium hover:bg-[#2F8D46]/20 transition-colors">
                                  GFG <ExternalLink size={9} />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Progress toggle */}
                          <button
                            onClick={() => cycleStatus(w.week)}
                            title="Click to cycle: Not Started → Practicing → Confident"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${pCfg.bg} ${pCfg.color}`}
                          >
                            <PIcon size={11} />
                            <span className="hidden sm:inline">{pCfg.label}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Week 18+ placeholder */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Calendar size={13} className="text-text-secondary/50" />
            </div>
            <h2 className="font-heading text-text-secondary/50 text-sm font-bold tracking-wide">
              Week 18 Onwards — To Be Announced
            </h2>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="pl-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.01] p-5 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-heading text-white/50 text-sm font-bold mb-1">
                Revision & Mixed-Topic Contests
              </div>
              <p className="text-text-secondary/40 text-xs max-w-md mx-auto">
                The revision schedule and topics for Week 18 onwards will be announced separately.
                Stay tuned to announcements!
              </p>
              <Link to="/dashboard/announcements"
                className="inline-flex items-center gap-1 mt-3 text-[11px] text-neon-cyan hover:underline">
                View Announcements <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="card bg-white/[0.02] text-center py-5">
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-neon-cyan" /> 17 Defined Weeks</span>
          <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gold" /> 4 Offline Grand Tests</span>
          <span className="flex items-center gap-1.5"><Wifi size={12} className="text-neon-cyan" /> 13 Online Contests</span>
          <span className="flex items-center gap-1.5"><Trophy size={12} className="text-warning" /> Every Saturday</span>
        </div>
        <p className="text-[10px] text-text-secondary/40 mt-2">Season: Aug 1, 2026 onwards</p>
      </div>

      <div className="text-center">
        <Link to="/schedule" className="text-neon-cyan text-xs hover:underline flex items-center justify-center gap-1">
          View Full Contest Schedule <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
