import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Globe, Building2, Star, Clock,
  Calendar, Filter, Bell, ExternalLink, Trophy, Zap
} from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';
import type { Contest as FirestoreContest } from '../../types';
import { getContests } from '../../lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────
type FilterType = 'All' | 'Online' | 'Offline' | 'Bonus' | 'Upcoming' | 'Completed';

interface MonthData {
  key: string;
  label: string;
  contests: FirestoreContest[];
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getContestStatus(c: FirestoreContest): 'Live' | 'Completed' | 'Upcoming' {
  if (c.status === 'Completed') return 'Completed';
  if (c.status === 'Active')    return 'Live';
  return 'Upcoming';
}

function groupByMonth(contests: FirestoreContest[]): MonthData[] {
  const map = new Map<string, MonthData>();
  for (const c of contests) {
    const d = new Date(c.date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
        contests: [],
      });
    }
    map.get(key)!.contests.push(c);
  }
  return Array.from(map.values());
}

function modeIcon(mode: string) {
  if (mode === 'Offline') return <Building2 size={14} className="text-neon-cyan shrink-0" />;
  if (mode === 'Online')  return <Globe     size={14} className="text-electric-blue shrink-0" />;
  return <Star size={14} className="text-gold shrink-0" />;
}

function modeLabel(c: FirestoreContest) {
  if (c.mode === 'Offline') return `🏫 Offline @ ${c.venue ?? 'BVRIT'}`;
  if ((c as any).contestType === 'Bonus') return '⭐ Bonus Challenge';
  return `🌐 Online · ${c.platform ?? 'TBA'}`;
}

function StatusBadge({ status }: { status: 'Live' | 'Completed' | 'Upcoming' }) {
  if (status === 'Live') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-numbers font-semibold bg-success/20 text-success border border-success/40">
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
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
function ContestRow({ c, index }: { c: FirestoreContest; index: number }) {
  const status   = getContestStatus(c);
  const isBonus  = (c as any).contestType === 'Bonus' || c.name?.toLowerCase().includes('bonus');

  return (
    <div className={`grid items-center gap-x-4 px-3 py-3 rounded-lg border transition-all duration-200 ${
      isBonus
        ? 'bg-gold/5 border-gold/20 hover:border-gold/40'
        : 'bg-navy/40 border-neon-cyan/10 hover:border-neon-cyan/30'
    }`}
    style={{ gridTemplateColumns: '56px 148px 1fr 180px auto' }}>

      {/* Col 1: Contest number */}
      <span className={`font-numbers font-bold text-sm ${isBonus ? 'text-gold' : 'text-neon-cyan'}`}>
        #{c.contestNumber ?? (index + 1)}
      </span>

      {/* Col 2: Date */}
      <div className="flex items-center gap-1.5">
        <Calendar size={12} className="text-text-secondary shrink-0" />
        <span className="text-xs text-white font-body whitespace-nowrap">{formatDate(c.date)}</span>
        <span className="text-[10px] text-text-secondary whitespace-nowrap">· Sat</span>
      </div>

      {/* Col 3: Mode (takes remaining space) */}
      <div className="flex items-center gap-1.5 min-w-0">
        {modeIcon(c.mode)}
        <span className={`text-xs font-body truncate ${isBonus ? 'text-gold' : 'text-text-secondary'}`}>
          {modeLabel(c)}
        </span>
      </div>

      {/* Col 4: Time */}
      <div className="flex items-center gap-1 whitespace-nowrap">
        <Clock size={11} className="text-text-secondary shrink-0" />
        <span className="text-[11px] text-text-secondary font-numbers">
          {c.startTime ?? '10:00'} – {c.endTime ?? '12:00'} IST
        </span>
        <span className="text-[11px] text-text-secondary/60">· {c.duration ?? 120} min</span>
      </div>

      {/* Col 5: Status + Action */}
      <div className="flex items-center gap-2 justify-end shrink-0">
        <StatusBadge status={status} />
        {status === 'Live' && c.contestLink && (
          <a href={c.contestLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-heading font-bold bg-success text-midnight uppercase tracking-wide hover:bg-success/90 transition-colors">
            <ExternalLink size={10} /> Join
          </a>
        )}
        {status === 'Upcoming' && c.contestLink && (
          <a href={c.contestLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-heading font-bold border border-neon-cyan/20 text-neon-cyan uppercase tracking-wide hover:bg-neon-cyan/10 transition-colors">
            <ExternalLink size={10} /> View
          </a>
        )}
        {status === 'Upcoming' && !c.contestLink && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-heading font-bold border border-neon-cyan/20 text-neon-cyan/40 uppercase tracking-wide">
            <Bell size={10} /> TBA
          </span>
        )}
        {status === 'Completed' && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-heading font-bold border border-white/20 text-text-secondary uppercase tracking-wide">
            <Trophy size={10} /> Done
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Month Card ───────────────────────────────────────────────────────────────
function MonthCard({ month, contests, defaultOpen }: {
  month: MonthData; contests: FirestoreContest[]; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const completedCount = contests.filter(c => getContestStatus(c) === 'Completed').length;

  return (
    <div className={`card border transition-all duration-300 ${open ? 'border-neon-cyan/30' : 'border-neon-cyan/10'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 group" aria-expanded={open}>
        <div className="flex items-center gap-3">
          <span className="heading-sm text-sm">{month.label}</span>
          <span className="text-[10px] font-numbers px-2 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue border border-electric-blue/20">
            {contests.length} contest{contests.length !== 1 ? 's' : ''}
          </span>
          {completedCount > 0 && (
            <span className="text-[10px] font-numbers text-text-secondary">{completedCount}/{contests.length} done</span>
          )}
        </div>
        <div className="text-neon-cyan">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
      <div className="flex flex-col gap-2 overflow-x-auto">
          {contests.map((c, i) => <ContestRow key={c.id} c={c} index={i} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(targetMs: number | null) {
  const [remaining, setRemaining] = useState<{ h: string; m: string; s: string } | null>(null);

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
function NextContestCard({ next }: { next: FirestoreContest }) {
  const [h, m] = (next.startTime ?? '10:00').split(':').map(Number);
  const d = new Date(next.date + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  const targetMs = d.getTime();
  const countdown = useCountdown(targetMs);
  const status = getContestStatus(next);
  const daysAway = Math.max(0, Math.ceil((targetMs - Date.now()) / 86400000));

  return (
    <div className="card-glow border border-neon-cyan/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-neon-cyan" />
            <span className="text-[10px] font-heading uppercase tracking-widest text-neon-cyan">Next Contest</span>
          </div>
          <h3 className="font-heading text-white text-base font-bold uppercase mb-1 truncate">{next.name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary font-body">
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(next.date)} · Saturday</span>
            <span className="flex items-center gap-1"><Clock size={11} />{next.startTime} – {next.endTime} IST</span>
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
          {status === 'Live' && next.contestLink ? (
            <a href={next.contestLink} target="_blank" rel="noopener noreferrer"
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5">
              <ExternalLink size={13} /> Join Now
            </a>
          ) : next.contestLink ? (
            <a href={next.contestLink} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5">
              <ExternalLink size={13} /> View Contest
            </a>
          ) : (
            <button className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 opacity-50 cursor-not-allowed">
              <Bell size={13} /> Link TBA
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
        <button key={f} onClick={() => onChange(f)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wide transition-all duration-200 border ${
            active === f
              ? 'bg-neon-cyan text-midnight border-neon-cyan'
              : 'border-neon-cyan/20 text-text-secondary hover:border-neon-cyan/40 hover:text-white'
          }`}>
          {f === 'Online'    && <Globe size={11} />}
          {f === 'Offline'   && <Building2 size={11} />}
          {f === 'Bonus'     && <Star size={11} />}
          {f === 'Upcoming'  && <Clock size={11} />}
          {f === 'Completed' && <Trophy size={11} />}
          {f === 'All'       && <Filter size={11} />}
          {f}
        </button>
      ))}
    </div>
  );
}

// ─── Season Progress ──────────────────────────────────────────────────────────
function SeasonProgress({ all }: { all: FirestoreContest[] }) {
  const completed = all.filter(c => getContestStatus(c) === 'Completed').length;
  const total     = all.length || 1;
  const pct       = Math.round((completed / total) * 100);

  return (
    <div className="card border-electric-blue/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-heading uppercase tracking-widest text-text-secondary">Season Progress</span>
        <span className="font-numbers font-bold text-sm text-neon-cyan">{completed}/{total} contests · {pct}%</span>
      </div>
      <div className="h-2 bg-navy rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-neon-cyan to-electric-blue rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pct, 1)}%` }} />
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
  const [contests, setContests] = useState<FirestoreContest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<FilterType>('All');

  useEffect(() => {
    getContests().then(data => {
      setContests(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const nextContest = contests.find(c => getContestStatus(c) === 'Live')
    ?? contests.find(c => getContestStatus(c) === 'Upcoming')
    ?? null;

  const filtered = contests.filter(c => {
    const status = getContestStatus(c);
    const isBonus = (c as any).contestType === 'Bonus' || c.name?.toLowerCase().includes('bonus');
    if (filter === 'All')       return true;
    if (filter === 'Bonus')     return isBonus;
    if (filter === 'Online')    return c.mode === 'Online' && !isBonus;
    if (filter === 'Offline')   return c.mode === 'Offline';
    if (filter === 'Upcoming')  return status === 'Upcoming';
    if (filter === 'Completed') return status === 'Completed';
    return true;
  });

  const months = groupByMonth(filtered);

  // Default open: month of next upcoming/live contest
  const defaultOpenKey = (() => {
    const ref = contests.find(c => getContestStatus(c) === 'Live')
      ?? contests.find(c => getContestStatus(c) === 'Upcoming');
    if (!ref) return null;
    const d = new Date(ref.date + 'T00:00:00');
    return `${d.getFullYear()}-${d.getMonth()}`;
  })();

  const completedCount = contests.filter(c => getContestStatus(c) === 'Completed').length;
  const upcomingCount  = contests.filter(c => getContestStatus(c) === 'Upcoming').length;

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
            <Calendar size={11} /> August 2026 – August 2027 · updates live
          </span>
          <div className="flex justify-center gap-6 mt-6">
            {[
              { label: 'Total Contests', value: contests.length },
              { label: 'Completed',      value: completedCount  },
              { label: 'Upcoming',       value: upcomingCount   },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="stat-number text-2xl">{value}</div>
                <div className="text-[10px] text-text-secondary font-body uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
          </div>
        ) : (
          <>
            {/* Season Progress */}
            <div className="mb-6"><SeasonProgress all={contests} /></div>

            {/* Next Contest Card */}
            {nextContest && (
              <div className="mb-6"><NextContestCard next={nextContest} /></div>
            )}

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="text-xs font-heading uppercase tracking-widest text-text-secondary shrink-0">Filter:</span>
              <FilterBar active={filter} onChange={setFilter} />
            </div>

            {/* Month Cards */}
            <div className="flex flex-col gap-4">
              {months.length === 0 ? (
                <div className="card text-center py-12">
                  <Trophy size={32} className="text-text-secondary mx-auto mb-3" />
                  <p className="text-text-secondary font-body">No contests match this filter.</p>
                  <button onClick={() => setFilter('All')} className="mt-4 btn-secondary text-xs px-4 py-2">Clear Filter</button>
                </div>
              ) : (
                months.map(month => (
                  <MonthCard
                    key={month.key}
                    month={month}
                    contests={month.contests}
                    defaultOpen={month.key === defaultOpenKey}
                  />
                ))
              )}
            </div>

            {/* Footer Note */}
            <div className="mt-12 card border-electric-blue/20 bg-navy/40">
              <p className="text-xs text-text-secondary font-body leading-relaxed">
                Weekly contests are conducted every Saturday as part of the CBB Weekly Coding League.
                Offline rounds are hosted at BVRIT, while online rounds are conducted on the official contest platform.
                Bonus Challenge weeks provide additional opportunities and may include sponsor-backed rewards.
                Contest links are added by admins before each event.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
