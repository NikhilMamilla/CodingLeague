import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, Clock, ChevronRight,
  ExternalLink, Star, Target, Zap, RotateCcw, Trophy,
} from 'lucide-react';
import { WEEK_TOPIC_MAP, PRACTICE_LINKS } from '../../lib/weekTopics';
import type { WeekBlock } from '../../lib/weekTopics';
import { getContests } from '../../lib/db';
import type { Contest } from '../../types';

const STORAGE_KEY = 'cwcl_topic_progress_v2';

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
  'not-started': { label: 'Not Started', color: 'text-text-secondary', bg: 'bg-white/5 border-white/10',     icon: Clock        },
  'practicing':  { label: 'Practicing',  color: 'text-warning',        bg: 'bg-warning/10 border-warning/30', icon: Zap          },
  'confident':   { label: 'Confident',   color: 'text-success',        bg: 'bg-success/10 border-success/30', icon: CheckCircle2 },
};

const NEXT_STATUS: Record<TopicStatus, TopicStatus> = {
  'not-started': 'practicing',
  'practicing':  'confident',
  'confident':   'not-started',
};

// Group consecutive weeks with the same topic into display blocks
interface TopicGroup {
  topic: string;
  icon: string;
  color: string;
  focusAreas: string[];
  weeks: WeekBlock[];
}

function groupWeeksByTopic(weeks: WeekBlock[]): TopicGroup[] {
  const groups: TopicGroup[] = [];
  for (const w of weeks) {
    const last = groups[groups.length - 1];
    if (last && last.topic === w.topic) {
      last.weeks.push(w);
    } else {
      groups.push({ topic: w.topic, icon: w.icon, color: w.color, focusAreas: w.focusAreas, weeks: [w] });
    }
  }
  return groups;
}

export default function TopicRoadmap() {
  const [progress, setProgress] = useState<Record<number, TopicStatus>>(loadProgress);
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  useEffect(() => { saveProgress(progress); }, [progress]);

  useEffect(() => {
    getContests().then(all => {
      setContests(all);
      // Determine the "active" week from live or upcoming contest
      const live     = all.find(c => c.status === 'Active');
      const upcoming = all.filter(c => c.status === 'Upcoming').sort((a, b) => a.date.localeCompare(b.date))[0];
      const ref = live ?? upcoming;
      if (ref?.weekNumber) setActiveWeek(ref.weekNumber);
    }).catch(() => {});
  }, []);

  function cycleStatus(week: number) {
    setProgress(prev => ({
      ...prev,
      [week]: NEXT_STATUS[prev[week] ?? 'not-started'],
    }));
  }

  function resetAll() {
    if (!confirm('Reset all topic progress? This cannot be undone.')) return;
    setProgress({});
  }

  // Get contest for a specific week number
  function getContestForWeek(weekNum: number): Contest | undefined {
    return contests.find(c => c.weekNumber === weekNum);
  }

  const totalWeeks  = WEEK_TOPIC_MAP.length;
  const confident   = Object.values(progress).filter(v => v === 'confident').length;
  const practicing  = Object.values(progress).filter(v => v === 'practicing').length;

  const groups = groupWeeksByTopic(WEEK_TOPIC_MAP);

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
            Week-wise topic schedule for CWCL 2026–27. Each contest = one week.
            Track your preparation progress below.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white hover:border-white/20 transition-colors self-start sm:self-auto"
        >
          <RotateCcw size={11} /> Reset Progress
        </button>
      </div>

      {/* Progress Summary */}
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
          <div className="stat-number text-2xl text-text-secondary">{totalWeeks - confident - practicing}</div>
          <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mt-0.5">Not Started</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-text-secondary/70 uppercase tracking-wider">Season Preparation</span>
          <span className="text-[11px] font-numbers text-neon-cyan">
            {Math.round((confident / totalWeeks) * 100)}% confident
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-warning to-success transition-all duration-700"
            style={{ width: `${Math.round(((confident + practicing * 0.5) / totalWeeks) * 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-success"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Confident</span>
          <span className="flex items-center gap-1 text-[10px] text-warning"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> Practicing</span>
          <span className="flex items-center gap-1 text-[10px] text-text-secondary/50"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" /> Not Started</span>
        </div>
      </div>

      {/* Topic Timeline — grouped by topic, each week shown individually */}
      <div className="space-y-6">
        {groups.map((group, gIdx) => {
          const links = PRACTICE_LINKS[group.topic];
          const isActiveGroup = group.weeks.some(w => w.week === activeWeek);

          return (
            <div key={gIdx} className={`rounded-2xl border transition-all ${
              isActiveGroup
                ? 'border-neon-cyan/40 bg-neon-cyan/[0.02] shadow-[0_0_24px_rgba(0,229,255,0.05)]'
                : 'border-white/8 bg-white/[0.01]'
            }`}>

              {/* Group header */}
              <div className={`flex items-center gap-3 px-5 py-4 border-b ${
                isActiveGroup ? 'border-neon-cyan/20' : 'border-white/8'
              }`}>
                <div className={`text-3xl`}>{group.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-heading font-bold text-sm ${isActiveGroup ? 'text-white' : 'text-white/80'}`}>
                    {group.topic}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {group.focusAreas.map(f => (
                      <span key={f} className={`text-[9px] px-2 py-0.5 rounded-full border ${
                        isActiveGroup
                          ? 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan/80'
                          : 'bg-white/5 border-white/10 text-text-secondary/60'
                      }`}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Practice links on the right */}
                {links && (
                  <div className="flex items-center gap-1.5 shrink-0">
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
              </div>

              {/* Individual week rows */}
              <div className="divide-y divide-white/5">
                {group.weeks.map(w => {
                  const contest        = getContestForWeek(w.week);
                  const isCurrentWeek  = w.week === activeWeek;
                  const topicStatus    = progress[w.week] ?? 'not-started';
                  const pCfg           = STATUS_CONFIG[topicStatus];
                  const PIcon          = pCfg.icon;

                  return (
                    <div key={w.week} className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                      isCurrentWeek ? 'bg-neon-cyan/[0.04]' : 'hover:bg-white/[0.02]'
                    }`}>

                      {/* Week badge */}
                      <div className={`w-14 shrink-0 text-center`}>
                        <div className={`text-xs font-numbers font-bold ${isCurrentWeek ? 'text-neon-cyan' : 'text-text-secondary/60'}`}>
                          Week {w.week}
                        </div>
                        <div className="text-[9px] text-text-secondary/40 mt-0.5">Contest {w.week}</div>
                      </div>

                      {/* Contest info */}
                      <div className="flex-1 min-w-0">
                        {contest ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium truncate ${isCurrentWeek ? 'text-white' : 'text-white/70'}`}>
                              {contest.name}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${
                              contest.status === 'Active'
                                ? 'bg-success/10 border-success/30 text-success animate-pulse'
                                : contest.status === 'Upcoming'
                                ? 'bg-warning/10 border-warning/30 text-warning'
                                : 'bg-white/5 border-white/10 text-text-secondary/50'
                            }`}>
                              {contest.status === 'Active' ? '🔴 LIVE' : contest.status}
                            </span>
                            <span className="text-[9px] text-text-secondary/40 shrink-0">{contest.date}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-text-secondary/40 italic">Not scheduled yet</span>
                        )}
                      </div>

                      {/* Current week marker */}
                      {isCurrentWeek && (
                        <span className="hidden sm:inline-flex text-[9px] px-2 py-0.5 bg-neon-cyan text-midnight font-heading font-bold rounded uppercase tracking-widest shrink-0">
                          ← Now
                        </span>
                      )}

                      {/* Progress toggle */}
                      <button
                        onClick={() => cycleStatus(w.week)}
                        title="Click to cycle: Not Started → Practicing → Confident"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-colors shrink-0 ${pCfg.bg} ${pCfg.color}`}
                      >
                        <PIcon size={11} />
                        <span className="hidden sm:inline">{pCfg.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Challenge weeks card */}
        <div className="card border-gold/20 bg-gold/[0.02] p-5">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <div className="font-heading font-bold text-sm text-white/80">
                Revision, Mixed Topics & Challenge Weeks
              </div>
              <div className="text-text-secondary/50 text-[11px] mt-0.5">
                Weeks 29–57 · Contests 29–57 · Feb 2027 onwards
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['Mixed Topic Contests', 'Bonus & Special Challenges', 'Season Finale'].map(f => (
                  <span key={f} className="text-[9px] px-2 py-0.5 rounded-full border bg-white/5 border-white/10 text-text-secondary/60">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Season info footer */}
      <div className="card bg-white/[0.02] text-center py-5">
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><Target size={12} className="text-neon-cyan" /> 57 Total Contests</span>
          <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-electric-blue" /> 28 Topic Weeks</span>
          <span className="flex items-center gap-1.5"><Zap size={12} className="text-warning" /> Every Saturday</span>
          <span className="flex items-center gap-1.5"><Trophy size={12} className="text-gold" /> Season: Aug 2026 – Aug 2027</span>
        </div>
        <p className="text-[10px] text-text-secondary/40 mt-2">Season: Aug 1, 2026 – Aug 7, 2027</p>
      </div>

      <div className="text-center">
        <Link to="/schedule" className="text-neon-cyan text-xs hover:underline flex items-center justify-center gap-1">
          View Full Contest Schedule <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
