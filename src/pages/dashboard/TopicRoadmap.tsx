import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, Clock, ChevronRight,
  ExternalLink, Star, Target, Zap, RotateCcw,
} from 'lucide-react';
import { WEEK_TOPICS, PRACTICE_LINKS, getBlockStatus } from '../../lib/weekTopics';

const STORAGE_KEY = 'cwcl_topic_progress';

type TopicStatus = 'not-started' | 'practicing' | 'confident';

function loadProgress(): Record<string, TopicStatus> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveProgress(p: Record<string, TopicStatus>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

const STATUS_CONFIG: Record<TopicStatus, { label: string; color: string; bg: string; icon: typeof Star }> = {
  'not-started': { label: 'Not Started', color: 'text-text-secondary', bg: 'bg-white/5 border-white/10',      icon: Clock         },
  'practicing':  { label: 'Practicing',  color: 'text-warning',        bg: 'bg-warning/10 border-warning/30',  icon: Zap           },
  'confident':   { label: 'Confident',   color: 'text-success',        bg: 'bg-success/10 border-success/30',  icon: CheckCircle2  },
};

const NEXT_STATUS: Record<TopicStatus, TopicStatus> = {
  'not-started': 'practicing',
  'practicing':  'confident',
  'confident':   'not-started',
};

export default function TopicRoadmap() {
  const [progress, setProgress] = useState<Record<string, TopicStatus>>(loadProgress);

  useEffect(() => { saveProgress(progress); }, [progress]);

  function cycleStatus(topic: string) {
    setProgress(prev => ({
      ...prev,
      [topic]: NEXT_STATUS[prev[topic] ?? 'not-started'],
    }));
  }

  function resetAll() {
    if (!confirm('Reset all topic progress? This cannot be undone.')) return;
    setProgress({});
  }

  const confident  = Object.values(progress).filter(v => v === 'confident').length;
  const practicing = Object.values(progress).filter(v => v === 'practicing').length;
  const total      = WEEK_TOPICS.filter(b => b.weekEnd <= 26).length; // exclude challenge weeks

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
            Week-wise topic schedule for CBB Weekly Coding League 2026–27.
            Track your preparation progress.
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
          <div className="stat-number text-2xl text-text-secondary">{total - confident - practicing}</div>
          <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mt-0.5">Not Started</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-text-secondary/70 uppercase tracking-wider">Season Preparation</span>
          <span className="text-[11px] font-numbers text-neon-cyan">{Math.round((confident / total) * 100)}% confident</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-warning to-success transition-all duration-700"
            style={{ width: `${Math.round(((confident + practicing * 0.5) / total) * 100)}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-success"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Confident</span>
          <span className="flex items-center gap-1 text-[10px] text-warning"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> Practicing</span>
          <span className="flex items-center gap-1 text-[10px] text-text-secondary/50"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" /> Not Started</span>
        </div>
      </div>

      {/* Topic Timeline */}
      <div className="space-y-3">
        {WEEK_TOPICS.map((block, idx) => {
          const blockStatus   = getBlockStatus(block);
          const topicProgress = progress[block.topic] ?? 'not-started';
          const pCfg          = STATUS_CONFIG[topicProgress];
          const PIcon         = pCfg.icon;
          const links         = PRACTICE_LINKS[block.topic];
          const isCurrent     = blockStatus === 'current';
          const isPast        = blockStatus === 'past';
          const isChallenge   = block.weekStart >= 27;

          return (
            <div key={idx}
              className={`relative card transition-all duration-200 ${
                isCurrent
                  ? 'border-neon-cyan/40 bg-neon-cyan/[0.03] shadow-[0_0_20px_rgba(0,229,255,0.06)]'
                  : isPast
                  ? 'border-white/5 opacity-75'
                  : 'border-white/8 hover:border-white/15'
              }`}
            >
              {/* Current week badge */}
              {isCurrent && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-neon-cyan text-midnight text-[9px] font-heading font-bold rounded uppercase tracking-widest">
                  ← Current Week
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Week number + icon */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isCurrent ? 'bg-neon-cyan/15 border border-neon-cyan/30' :
                    isPast    ? 'bg-white/5 border border-white/10' :
                                'bg-white/5 border border-white/8'
                  }`}>
                    {block.icon}
                  </div>
                  <div className="sm:hidden">
                    <div className={`text-[10px] font-numbers font-bold ${isCurrent ? 'text-neon-cyan' : 'text-text-secondary/60'}`}>
                      Week {block.weeks}
                    </div>
                    <div className="text-[9px] text-text-secondary/40">Contest {block.contests}</div>
                  </div>
                </div>

                {/* Week label — desktop only */}
                <div className="hidden sm:flex flex-col items-center w-16 shrink-0">
                  <div className={`text-xs font-numbers font-bold ${isCurrent ? 'text-neon-cyan' : 'text-text-secondary/60'}`}>
                    Wk {block.weeks}
                  </div>
                  <div className="text-[9px] text-text-secondary/40">C {block.contests}</div>
                </div>

                {/* Topic info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-heading text-sm font-bold ${isCurrent ? 'text-white' : isPast ? 'text-white/60' : 'text-white/90'}`}>
                    {block.topic}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {block.focusAreas.map(f => (
                      <span key={f}
                        className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${
                          isCurrent
                            ? 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan/80'
                            : 'bg-white/5 border-white/10 text-text-secondary/60'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-text-secondary/40 mt-1.5">{block.dateRange}</div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                  {/* Practice links */}
                  {!isChallenge && links && (
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

                  {/* Progress toggle button */}
                  {!isChallenge && (
                    <button
                      onClick={() => cycleStatus(block.topic)}
                      title="Click to cycle: Not Started → Practicing → Confident"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${pCfg.bg} ${pCfg.color}`}
                    >
                      <PIcon size={11} /> {pCfg.label}
                    </button>
                  )}

                  {/* Status badge for upcoming/past */}
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    isCurrent ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30' :
                    isPast    ? 'bg-white/5 text-text-secondary/40 border border-white/10' :
                                'bg-white/5 text-text-secondary/40 border border-white/10'
                  }`}>
                    {isCurrent ? '🟢 Now' : isPast ? '✓ Done' : '⏳ Upcoming'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Season info footer */}
      <div className="card bg-white/[0.02] text-center py-5">
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><Target size={12} className="text-neon-cyan" /> 57 Total Contests</span>
          <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-electric-blue" /> 27 Topic Weeks</span>
          <span className="flex items-center gap-1.5"><Zap size={12} className="text-warning" /> Every Saturday</span>
          <span className="flex items-center gap-1.5"><Star size={12} className="text-gold" /> Online & Offline</span>
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
