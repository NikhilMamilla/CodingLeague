import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Globe, Building2, Star, Clock,
  Calendar, Filter, Bell, ExternalLink, Trophy, Zap
} from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = 'Online' | 'Offline' | 'Bonus';
type Status = 'Upcoming' | 'Live' | 'Completed';
type FilterType = 'All' | 'Online' | 'Offline' | 'Bonus' | 'Upcoming' | 'Completed';

interface Contest {
  id: number;          // global #1–#48
  date: Date;
  mode: Mode;
  status: Status;
  monthIndex: number;
  weekInMonth: number; // 1–5
}

interface MonthData {
  index: number;
  label: string;
  contests: Contest[];
}

// ─── Raw Schedule ─────────────────────────────────────────────────────────────
const RAW: [number, number, number, Mode][] = [
  // [year, month(0-indexed), day, mode]
  [2026, 7, 1, 'Online'], [2026, 7, 8, 'Offline'], [2026, 7, 15, 'Online'], [2026, 7, 22, 'Offline'], [2026, 7, 29, 'Bonus'],
  [2026, 8, 5, 'Online'], [2026, 8, 12, 'Offline'], [2026, 8, 19, 'Online'], [2026, 8, 26, 'Offline'],
  [2026, 9, 3, 'Online'], [2026, 9, 10, 'Offline'], [2026, 9, 17, 'Online'], [2026, 9, 24, 'Offline'], [2026, 9, 31, 'Bonus'],
  [2026, 10, 7, 'Online'], [2026, 10, 14, 'Offline'], [2026, 10, 21, 'Online'], [2026, 10, 28, 'Offline'],
  [2026, 11, 5, 'Online'], [2026, 11, 12, 'Offline'], [2026, 11, 19, 'Online'], [2026, 11, 26, 'Offline'],
  [2027, 0, 2, 'Online'], [2027, 0, 9, 'Offline'], [2027, 0, 16, 'Online'], [2027, 0, 23, 'Offline'], [2027, 0, 30, 'Bonus'],
  [2027, 1, 6, 'Online'], [2027, 1, 13, 'Offline'], [2027, 1, 20, 'Online'], [2027, 1, 27, 'Offline'],
  [2027, 2, 6, 'Online'], [2027, 2, 13, 'Offline'], [2027, 2, 20, 'Online'], [2027, 2, 27, 'Offline'],
  [2027, 3, 3, 'Online'], [2027, 3, 10, 'Offline'], [2027, 3, 17, 'Online'], [2027, 3, 24, 'Offline'],
  [2027, 4, 1, 'Online'], [2027, 4, 8, 'Offline'], [2027, 4, 15, 'Online'], [2027, 4, 22, 'Offline'], [2027, 4, 29, 'Bonus'],
  [2027, 5, 5, 'Online'], [2027, 5, 12, 'Offline'], [2027, 5, 19, 'Online'], [2027, 5, 26, 'Offline'],
  [2027, 6, 3, 'Online'], [2027, 6, 10, 'Offline'], [2027, 6, 17, 'Online'], [2027, 6, 24, 'Offline'], [2027, 6, 31, 'Bonus'],
  [2027, 7, 7, 'Online'], [2027, 7, 14, 'Offline'], [2027, 7, 21, 'Online'], [2027, 7, 28, 'Offline'],
];

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getStatus(date: Date): Status {
  const now = new Date();
  const start = new Date(date); start.setHours(10, 0, 0, 0);
  const end = new Date(date); end.setHours(12, 0, 0, 0);
  if (now >= start && now <= end) return 'Live';
  if (now > end) return 'Completed';
  return 'Upcoming';
}

// Build contests list with global numbering
const allContests: Contest[] = RAW.map(([y, m, d, mode], idx) => {
  const date = new Date(y, m, d);
  // week-in-month: count same-mode+month entries before this one
  const weekInMonth = RAW.slice(0, idx).filter(([yy, mm]) => yy === y && mm === m).length + 1;
  return { id: idx + 1, date, mode, status: getStatus(date), monthIndex: m + y * 12, weekInMonth };
});

// Group by month
function buildMonths(): MonthData[] {
  const map = new Map<string, MonthData>();
  allContests.forEach(c => {
    const key = `${c.date.getFullYear()}-${c.date.getMonth()}`;
    if (!map.has(key)) {
      map.set(key, {
        index: c.monthIndex,
        label: `${MONTH_LABELS[c.date.getMonth()]} ${c.date.getFullYear()}`,
        contests: [],
      });
    }
    map.get(key)!.contests.push(c);
  });
  return Array.from(map.values());
}

const MONTHS = buildMonths();
const TOTAL = allContests.length;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function modeIcon(mode: Mode) {
  if (mode === 'Online') return <Globe size={14} className="text-electric-blue shrink-0" />;
  if (mode === 'Offline') return <Building2 size={14} className="text-neon-cyan shrink-0" />;
  return <Star size={14} className="text-gold shrink-0" />;
}

function modeLabel(mode: Mode) {
  if (mode === 'Online') return '🌐 Online';
  if (mode === 'Offline') return '🏫 Offline @ BVRIT';
  return '⭐ Bonus Challenge';
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'Live') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-numbers font-semibold bg-success/20 text-success border border-success/40">
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      Live
    </span>
  );
  if (status === 'Completed') return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-numbers font-semibold bg-white/5 text-text-secondary border border-white/10">
      Completed
    </span>
  );
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-numbers font-semibold bg-warning/10 text-warning border border-warning/30">
      Upcoming
    </span>
  );
}

// ─── Contest Row ──────────────────────────────────────────────────────────────
function ContestRow({ c }: { c: Contest }) {
  const isBonus = c.mode === 'Bonus';
  const platform = c.mode === 'Offline' ? 'BVRIT Campus' : c.mode === 'Online' ? 'TBA' : 'Special Event';
  const weekLabel = isBonus ? 'Bonus' : `Week ${c.weekInMonth}`;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-3 rounded-lg border transition-all duration-200 ${
      isBonus
        ? 'bg-gold/5 border-gold/20 hover:border-gold/40'
        : 'bg-navy/40 border-neon-cyan/10 hover:border-neon-cyan/30'
    }`}>
      {/* Number + week */}
      <div className="flex items-center gap-2 shrink-0 min-w-[90px]">
        <span className={`font-numbers font-bold text-sm ${isBonus ? 'text-gold' : 'text-neon-cyan'}`}>#{c.id}</span>
        <span className={`text-[10px] font-numbers px-1.5 py-0.5 rounded ${
          isBonus ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
        }`}>{weekLabel}</span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 shrink-0 min-w-[120px]">
        <Calendar size={12} className="text-text-secondary shrink-0" />
        <span className="text-xs text-white font-body">{formatDate(c.date)}</span>
        <span className="text-[10px] text-text-secondary">· Sat</span>
      </div>

      {/* Mode */}
      <div className="flex items-center gap-1.5 min-w-[150px]">
        {modeIcon(c.mode)}
        <span className={`text-xs font-body ${isBonus ? 'text-gold' : 'text-text-secondary'}`}>{modeLabel(c.mode)}</span>
      </div>

      {/* Time + Platform */}
      <div className="hidden md:flex items-center gap-3 flex-1">
        <span className="text-[11px] text-text-secondary font-numbers flex items-center gap-1">
          <Clock size={11} />10:00 AM – 12:00 PM IST
        </span>
        <span className="text-[11px] text-text-secondary">· {platform}</span>
      </div>

      {/* Status + Action */}
      <div className="flex items-center gap-2 sm:ml-auto shrink-0">
        <StatusBadge status={c.status} />
        {c.status === 'Live' && (
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-heading font-bold bg-success text-midnight uppercase tracking-wide hover:bg-success/90 transition-colors">
            <ExternalLink size={10} /> Join
          </button>
        )}
        {c.status === 'Completed' && (
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-heading font-bold border border-white/20 text-text-secondary uppercase tracking-wide hover:border-neon-cyan/40 hover:text-neon-cyan transition-colors">
            <Trophy size={10} /> Result
          </button>
        )}
        {c.status === 'Upcoming' && (
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-heading font-bold border border-neon-cyan/20 text-neon-cyan uppercase tracking-wide hover:bg-neon-cyan/10 transition-colors">
            <Bell size={10} /> Remind
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Month Card ───────────────────────────────────────────────────────────────
function MonthCard({ month, contests, defaultOpen }: {
  month: MonthData; contests: Contest[]; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const completedCount = contests.filter(c => c.status === 'Completed').length;

  return (
    <div className={`card border transition-all duration-300 ${open ? 'border-neon-cyan/30' : 'border-neon-cyan/10'}`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="heading-sm text-sm">{month.label}</span>
          <span className="text-[10px] font-numbers px-2 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue border border-electric-blue/20">
            {contests.length} contest{contests.length !== 1 ? 's' : ''}
          </span>
          {completedCount > 0 && (
            <span className="text-[10px] font-numbers text-text-secondary">{completedCount}/{contests.length} done</span>
          )}
        </div>
        <div className={`text-neon-cyan transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-0'}`}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Contest list with CSS transition */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col gap-2">
          {contests.map(c => <ContestRow key={c.id} c={c} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(target: Date | null) {
  const [remaining, setRemaining] = useState<{ h: string; m: string; s: string } | null>(null);
  // Stable timestamp reference to prevent infinite re-runs
  const targetMs = target?.getTime() ?? null;

  useEffect(() => {
    if (!targetMs) return;
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) { setRemaining({ h: '00', m: '00', s: '00' }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ h: pad(h), m: pad(m), s: pad(s) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return remaining;
}

// ─── Next Contest Card ────────────────────────────────────────────────────────
function NextContestCard({ next }: { next: Contest | null }) {
  const target = next
    ? new Date(next.date.getFullYear(), next.date.getMonth(), next.date.getDate(), 10, 0, 0)
    : null;
  const countdown = useCountdown(target);

  if (!next) return null;

  const daysAway = Math.ceil((next.date.getTime() - Date.now()) / 86400000);

  return (
    <div className="card-glow border border-neon-cyan/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-neon-cyan" />
            <span className="text-[10px] font-heading uppercase tracking-widest text-neon-cyan">Next Contest</span>
          </div>
          <h3 className="font-heading text-white text-base font-bold uppercase mb-1">
            Contest #{next.id} — {next.mode === 'Bonus' ? 'Bonus Challenge' : `${next.mode} Round`}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary font-body">
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(next.date)} · Saturday</span>
            <span className="flex items-center gap-1"><Clock size={11} />10:00 AM – 12:00 PM IST</span>
            {daysAway > 0 && <span className="text-neon-cyan font-numbers font-semibold">In {daysAway} day{daysAway !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        {countdown && (
          <div className="flex items-center gap-1 shrink-0">
            {(['h', 'm', 's'] as const).map((unit, i) => (
              <React.Fragment key={unit}>
                {i > 0 && <span className="text-neon-cyan/40 font-numbers font-bold text-xl">:</span>}
                <div className="flex flex-col items-center bg-midnight border border-neon-cyan/20 rounded-lg px-2.5 py-1.5 min-w-[44px]">
                  <span className="stat-number text-xl leading-none">{countdown[unit]}</span>
                  <span className="text-[9px] text-text-secondary font-numbers uppercase tracking-widest mt-0.5">
                    {unit === 'h' ? 'hrs' : unit === 'm' ? 'min' : 'sec'}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="shrink-0">
          {next.status === 'Live' ? (
            <button className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5">
              <ExternalLink size={13} /> Join Now
            </button>
          ) : (
            <button className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5">
              <Bell size={13} /> Set Reminder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const FILTERS: FilterType[] = ['All', 'Online', 'Offline', 'Bonus', 'Upcoming', 'Completed'];

function FilterBar({ active, onChange }: { active: FilterType; onChange: (f: FilterType) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter contests">
      {FILTERS.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wide transition-all duration-200 border ${
            active === f
              ? 'bg-neon-cyan text-midnight border-neon-cyan'
              : 'border-neon-cyan/20 text-text-secondary hover:border-neon-cyan/40 hover:text-white'
          }`}
        >
          {f === 'Online' && <Globe size={11} />}
          {f === 'Offline' && <Building2 size={11} />}
          {f === 'Bonus' && <Star size={11} />}
          {f === 'Upcoming' && <Clock size={11} />}
          {f === 'Completed' && <Trophy size={11} />}
          {f === 'All' && <Filter size={11} />}
          {f}
        </button>
      ))}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function SeasonProgress() {
  const completed = allContests.filter(c => c.status === 'Completed').length;
  const pct = Math.round((completed / TOTAL) * 100);

  return (
    <div className="card border-electric-blue/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-heading uppercase tracking-widest text-text-secondary">Season Progress</span>
        <span className="font-numbers font-bold text-sm text-neon-cyan">{completed}/{TOTAL} contests · {pct}%</span>
      </div>
      <div className="h-2 bg-navy rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-neon-cyan to-electric-blue rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-text-secondary font-numbers">
        <span>Aug 2026</span>
        <span>Aug 2027</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Schedule() {
  const [filter, setFilter] = useState<FilterType>('All');

  // Next upcoming or live contest
  const nextContest = allContests.find(c => c.status === 'Live') ?? allContests.find(c => c.status === 'Upcoming') ?? null;

  const aug2026Key = '2026-7';
  const defaultOpenKey = (() => {
    const live = allContests.find(c => c.status === 'Live');
    const upcoming = allContests.find(c => c.status === 'Upcoming');
    const ref = live ?? upcoming;
    if (ref) return `${ref.date.getFullYear()}-${ref.date.getMonth()}`;
    return aug2026Key;
  })();

  // Filtered view
  const filteredMonths = MONTHS.map(m => ({
    month: m,
    contests: m.contests.filter(c => {
      if (filter === 'All') return true;
      if (filter === 'Online' || filter === 'Offline' || filter === 'Bonus') return c.mode === filter;
      return c.status === filter;
    }),
  })).filter(({ contests }) => contests.length > 0);

  const completedCount = allContests.filter(c => c.status === 'Completed').length;
  const upcomingCount = allContests.filter(c => c.status === 'Upcoming').length;

  return (
    <div className="bg-midnight min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 pb-12">

        {/* ── Page Header ── */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <CBBLogo size={56} glow={false} />
          </div>
          <h1 className="heading-lg mb-2">Schedule</h1>
          <p className="font-body text-text-secondary text-base mb-4">Every Saturday. Every Week. One League.</p>
          <span className="inline-flex items-center gap-2 bg-neon-cyan/5 border border-neon-cyan/20 rounded-full px-4 py-1.5 text-xs font-heading text-neon-cyan uppercase tracking-widest">
            <Calendar size={11} /> August 2026 – August 2027
          </span>

          {/* Quick stats */}
          <div className="flex justify-center gap-6 mt-6">
            {[
              { label: 'Total Contests', value: TOTAL },
              { label: 'Completed', value: completedCount },
              { label: 'Upcoming', value: upcomingCount },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="stat-number text-2xl">{value}</div>
                <div className="text-[10px] text-text-secondary font-body uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Season Progress ── */}
        <div className="mb-6">
          <SeasonProgress />
        </div>

        {/* ── Next Contest Card ── */}
        {nextContest && (
          <div className="mb-6">
            <NextContestCard next={nextContest} />
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-xs font-heading uppercase tracking-widest text-text-secondary shrink-0">Filter:</span>
          <FilterBar active={filter} onChange={setFilter} />
        </div>

        {/* ── Month Cards ── */}
        <div className="flex flex-col gap-4">
          {filteredMonths.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy size={32} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary font-body">No contests match this filter.</p>
              <button onClick={() => setFilter('All')} className="mt-4 btn-secondary text-xs px-4 py-2">Clear Filter</button>
            </div>
          ) : (
            filteredMonths.map(({ month, contests }) => {
              const key = `${month.contests[0]?.date.getFullYear()}-${month.contests[0]?.date.getMonth()}`;
              return (
                <MonthCard
                  key={month.index}
                  month={month}
                  contests={contests}
                  defaultOpen={key === defaultOpenKey}
                />
              );
            })
          )}
        </div>

        {/* ── Footer Note ── */}
        <div className="mt-12 card border-electric-blue/20 bg-navy/40">
          <p className="text-xs text-text-secondary font-body leading-relaxed">
            Weekly contests are conducted every Saturday as part of the CBB Weekly Coding League.
            Offline rounds are hosted at BVRIT, while online rounds are conducted on the official contest platform.
            Bonus Challenge weeks provide additional learning and recognition opportunities and may include
            sponsor-backed rewards or special themed contests.
          </p>
        </div>

      </div>
    </div>
  );
}
