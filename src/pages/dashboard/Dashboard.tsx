import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Trophy, Calendar, Award, Zap,
  Star, Code2, ExternalLink, User, ChevronRight,
  Megaphone, Crown, Info, Users, Send,
  Sparkles, Download, BookOpen, Target,
} from 'lucide-react';
import { downloadFoundingCertificate } from '../../lib/certificateGenerator';
import { useAuth } from '../../contexts/AuthContext';
import type { Contest, ContestResult, Announcement } from '../../types';
import { BADGE_META } from '../../types';
import toast from 'react-hot-toast';
import { getContests, getParticipants, getAnnouncements, getSetting, getResultsByParticipant } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { getTopicByWeek, PRACTICE_LINKS } from '../../lib/weekTopics';

const TIER_CFG: Record<string, { cls: string; next: number; min: number; nextName: string }> = {
  Beginner:               { cls: 'text-gray-400 font-semibold',    next: 900,   min: 800,  nextName: 'Explorer'              },
  Explorer:               { cls: 'text-emerald-400 font-semibold', next: 1000,  min: 900,  nextName: 'Coder'                 },
  Coder:                  { cls: 'text-cyan-400 font-semibold',    next: 1100,  min: 1000, nextName: 'Specialist'            },
  Specialist:             { cls: 'text-blue-400 font-semibold',    next: 1250,  min: 1100, nextName: 'Expert'                },
  Expert:                 { cls: 'text-indigo-400 font-semibold',  next: 1450,  min: 1250, nextName: 'Candidate Master'       },
  'Candidate Master':     { cls: 'text-purple-400 font-semibold',  next: 1650,  min: 1450, nextName: 'Master'                },
  Master:                 { cls: 'text-amber-400 font-semibold',   next: 1850,  min: 1650, nextName: 'Grandmaster'           },
  Grandmaster:            { cls: 'text-rose-400 font-semibold',    next: 2100,  min: 1850, nextName: 'Legendary Grandmaster' },
  'Legendary Grandmaster':{ cls: 'text-red-500 font-bold',         next: 99999, min: 2100, nextName: 'Max'                   },
};

const PLATFORM_CFG = [
  { key: 'hackerrankUsername', label: 'HackerRank',    color: '#00EA64' },
  { key: 'codechefUsername',   label: 'CodeChef',      color: '#B17A50' },
  { key: 'leetcodeUsername',   label: 'LeetCode',      color: '#FFA116' },
  { key: 'codeforcesHandle',   label: 'Codeforces',    color: '#1890FF' },
  { key: 'gfgUsername',        label: 'GeeksforGeeks', color: '#2F8D46' },
] as const;

function StatCard({ icon: Icon, label, value, color = 'text-neon-cyan', infoText }: {
  icon: React.ElementType; label: string; value: string | number; color?: string; infoText?: string;
}) {
  return (
    <div className="card flex items-center gap-4 py-4">
      <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
        <Icon size={17} className={color} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="text-text-secondary text-[10px] uppercase tracking-widest">{label}</div>
          {infoText && (
            <button
              type="button"
              aria-label={`More info about ${label}`}
              title={infoText}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-neon-cyan/30 text-[10px] text-neon-cyan/80 hover:bg-neon-cyan/10 transition-colors"
            >
              <Info size={10} />
            </button>
          )}
        </div>
        <div className={`stat-number text-xl ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function CountdownTimer({ date, startTime }: { date: string; startTime: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    // Combine date "2026-08-01" + startTime "10:00" into a full datetime
    const target = new Date(`${date}T${startTime}:00`);
    if (isNaN(target.getTime())) { setRemaining('--:--:--'); return; }
    function calc() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setRemaining('Live Now!'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(h > 24
        ? `${Math.floor(h / 24)}d ${h % 24}h`
        : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [date, startTime]);
  return <span className="stat-number text-2xl text-neon-cyan">{remaining}</span>;
}

interface LeaderRow {
  uid: string; participantId: string; fullName: string;
  college: string; rating: number; tier: string; contestsParticipated: number;
  foundingMember?: boolean;
}

interface FoundingSlotState {
  enabled: boolean;
  claimed: number;
  max: number;
  seasonLabel: string;
}
interface AnnouncementRow extends Announcement { id: string; }

function rankColor(n: number) {
  return n === 1 ? 'text-gold' : n === 2 ? 'text-silver' : n === 3 ? 'text-bronze' : 'text-text-secondary';
}
function rankEmoji(n: number) {
  return n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : null;
}

export default function Dashboard() {
  const { participant } = useAuth();
  const [activeContest,    setActiveContest]   = useState<Contest | null>(null);
  const [upcomingContest,  setUpcomingContest] = useState<Contest | null>(null);
  const [recentResults,   setRecentResults]   = useState<ContestResult[]>([]);
  const [leaderboard,     setLeaderboard]     = useState<LeaderRow[]>([]);
  const [announcements,   setAnnouncements]   = useState<AnnouncementRow[]>([]);
  const [loadingContest,  setLoadingContest]  = useState(true);
  const [loadingLeader,   setLoadingLeader]   = useState(true);
  const [myRank,          setMyRank]          = useState<number | null>(null);
  const [allRanked,       setAllRanked]       = useState<LeaderRow[]>([]);
  const [announcementWhatsapp, setAnnouncementWhatsapp] = useState('');
  const [whatsappDismissed, setWhatsappDismissed] = useState(() =>
    sessionStorage.getItem('cwcl_wa_banner_dismissed') === 'true'
  );
  const [foundingSlots, setFoundingSlots] = useState<FoundingSlotState>({ enabled: false, claimed: 0, max: 20, seasonLabel: '2026–27' });

  useEffect(() => {
    // Contests — filter client-side
    getContests().then(all => {
      setActiveContest(all.find(c => c.status === 'Active') ?? null);
      setUpcomingContest(
        all.filter(c => c.status === 'Upcoming').sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
      );
      setLoadingContest(false);
    }).catch(() => setLoadingContest(false));

    // Leaderboard - only top 10 for overview
    getParticipants(0).then(all => {
      const filtered = all.filter(r => r.role !== 'admin' && r.role !== 'super_admin') as LeaderRow[];
      setLeaderboard(filtered.slice(0, 10));
      setAllRanked(filtered);
      setLoadingLeader(false);
    }).catch(() => setLoadingLeader(false));

    // Announcements
    getAnnouncements(4).then(list => setAnnouncements(list as AnnouncementRow[])).catch(() => {});

    // Community WhatsApp link
    getSetting('community').then(data => {
      if (data?.announcementWhatsapp) setAnnouncementWhatsapp(data.announcementWhatsapp);
    }).catch(() => {});

    // Founding settings + count
    Promise.all([
      getSetting('foundingMembers'),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('founding_member', true),
    ]).then(([settings, { count }]) => {
      setFoundingSlots(prev => ({
        enabled: settings?.enabled === true,
        claimed: count ?? 0,
        max: Number(settings?.maxFoundingMembers) || prev.max,
        seasonLabel: settings?.seasonLabel || prev.seasonLabel,
      }));
    }).catch(() => {});

    // User's own recent results
    if (participant?.participantId) {
      getResultsByParticipant(participant.participantId)
        .then(r => setRecentResults(r.slice(0, 5)))
        .catch(() => {});
    }
  }, [participant?.uid]);

  // Recompute rank whenever the full ranked list or participant changes
  useEffect(() => {
    if (!participant || allRanked.length === 0) return;
    const idx = allRanked.findIndex(r => r.uid === participant.uid);
    setMyRank(idx !== -1 ? idx + 1 : null);
  }, [allRanked, participant?.uid]);

  if (!participant) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
    </div>
  );

  const tc  = TIER_CFG[participant.tier] ?? TIER_CFG.Beginner;
  const pct = participant.tier === 'Grandmaster'
    ? 100
    : Math.min(100, Math.round(((participant.rating - tc.min) / (tc.next - tc.min)) * 100));
  const filledProfiles = PLATFORM_CFG.filter(p => (participant as any)[p.key]).length;

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ── */}
      <div className="card-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center shrink-0 overflow-hidden">
              {participant.photoURL
                ? <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="font-heading text-2xl text-neon-cyan font-bold">
                    {participant.fullName.charAt(0).toUpperCase()}
                  </span>
              }
            </div>
            <div>
              <h1 className="heading-md mb-1">
                Welcome back, <span className="text-neon-cyan">{participant.fullName.split(' ')[0]}</span> 👋
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-numbers text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded">
                  {participant.participantId}
                </span>
                <span className={tc.cls}>{participant.tier}</span>
                <span className="text-text-secondary text-xs hidden sm:inline">· {participant.college}</span>
              </div>
            </div>
          </div>
          <Link to="/schedule" className="hidden sm:flex btn-primary text-xs px-5 py-2 items-center gap-2 shrink-0">
            <Calendar size={12} /> View Schedule
          </Link>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">
              Progress → {tc.nextName}
            </span>
            <span className="text-[10px] font-numbers text-neon-cyan">
              {participant.rating} / {tc.next === 9999 ? '∞' : tc.next}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-neon-cyan rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Founding Member Welcome Card ── */}
      {participant.foundingMember && (
        <div className="card border-gold/30 founding-glow">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <Crown size={28} className="text-gold" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="heading-sm !text-gold text-sm mb-1">Congratulations, Founding Member!</h2>
              <p className="text-text-secondary text-xs leading-relaxed">
                You are #{participant.foundingRank} of {foundingSlots.max} inaugural members for CWCL {foundingSlots.seasonLabel}.
                Your exclusive badge and founding certificate are ready below.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
              <Link to="/dashboard/profile"
                className="btn-primary text-xs px-4 py-2 flex items-center justify-center gap-1.5 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20">
                <Star size={12} /> View Badge
              </Link>
              <button
                onClick={() => {
                  toast.loading('Generating certificate…', { id: 'fm-cert' });
                  downloadFoundingCertificate({
                    certificateId: `CWCL-FM-${participant.participantId}`,
                    participantName: participant.fullName,
                    season: participant.foundingSeasonId || foundingSlots.seasonLabel,
                    issuedDate: participant.foundingAwardedAt
                      ? new Date(participant.foundingAwardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                  }).then(() => toast.success('Certificate downloaded!', { id: 'fm-cert' }))
                    .catch(() => toast.error('Download failed', { id: 'fm-cert' }));
                }}
                className="btn-primary text-xs px-4 py-2 flex items-center justify-center gap-1.5"
              >
                <Download size={12} /> Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Community Banner (once per session, dismissible) ── */}
      {announcementWhatsapp && !whatsappDismissed && (
        <div className="relative bg-card-dark border border-neon-cyan/25 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center shrink-0 mt-0.5">
              <Users size={16} className="text-neon-cyan" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Join our Official CWCL WhatsApp Announcement Community</p>
              <p className="text-text-secondary text-[11px] mt-0.5">Receive contest updates, results, and important notifications directly.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={announcementWhatsapp} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-cyan text-midnight font-heading font-bold text-[10px] uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all active:scale-95"
            >
              <Send size={11} /> Join Now
            </a>
            <button
              onClick={() => {
                setWhatsappDismissed(true);
                sessionStorage.setItem('cwcl_wa_banner_dismissed', 'true');
              }}
              className="text-text-secondary/50 hover:text-white p-1.5 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Rating"
          value={participant.rating}
          color="text-neon-cyan"
          infoText="Your rating starts at 800 when you join CWCL. It changes after each contest based on your performance."
        />
        <StatCard icon={Trophy}     label="Contests"   value={participant.contestsParticipated}            color="text-electric-blue"  />
        <StatCard icon={Award}      label="Badges"     value={participant.badges?.length ?? 0}             color="text-gold"           />
        <StatCard icon={Crown}      label="My Rank"    value={myRank ? `#${myRank}` : '—'}                color="text-success"        />
        <StatCard
          icon={Sparkles}
          label="Founding Slots"
          value={`${foundingSlots.claimed} / ${foundingSlots.max}`}
          color={foundingSlots.claimed >= foundingSlots.max ? 'text-text-secondary' : 'text-gold'}
          infoText="Limited founding member slots for the inaugural season. First come, first served."
        />
      </div>

      {/* ── Community Banner (Always shown after stat cards) ── */}
      {announcementWhatsapp && (
        <div className="relative bg-card-dark border border-neon-cyan/25 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center shrink-0 mt-0.5">
              <Users size={16} className="text-neon-cyan" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Join our Official CWCL WhatsApp Announcement Community</p>
              <p className="text-text-secondary text-[11px] mt-0.5">Receive contest updates, results, and important notifications directly.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={announcementWhatsapp} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-cyan text-midnight font-heading font-bold text-[10px] uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all active:scale-95"
            >
              <Send size={11} /> Join Now
            </a>
          </div>
        </div>
      )}
      {(() => {
        // Determine which contest to derive the week topic from:
        // Priority: Active contest → Upcoming contest → fallback null
        const referenceContest = activeContest ?? upcomingContest;
        const weekNum = referenceContest?.weekNumber ?? null;
        const display = weekNum ? getTopicByWeek(weekNum) : null;
        if (!display) return null;
        const links = PRACTICE_LINKS[display.topic];
        const isLive = !!activeContest;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* This Week's Topic Card */}
            <div className="lg:col-span-2 card border-neon-cyan/30 bg-neon-cyan/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                    <BookOpen size={13} className="text-neon-cyan" />
                  </div>
                  <h2 className="heading-sm !text-sm">
                    {isLive ? '🔴 Live Contest Topic' : "This Week's Topic"}
                  </h2>
                </div>
                <Link to="/dashboard/roadmap" className="text-neon-cyan text-xs hover:underline flex items-center gap-1">
                  Full Roadmap <ChevronRight size={11} />
                </Link>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-4xl shrink-0">{display.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-white text-base font-bold leading-tight">{display.topic}</div>
                  <div className="text-text-secondary/60 text-[11px] mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded font-bold text-[10px]">
                      Week {weekNum} · Contest {weekNum}
                    </span>
                    {referenceContest && (
                      <span className="text-text-secondary/50">{referenceContest.name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {display.focusAreas.map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan/80">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {links && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-text-secondary/50 uppercase tracking-wider mr-1">Practice Now:</span>
                  {links.leetcode && (
                    <a href={links.leetcode} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFA116]/10 border border-[#FFA116]/20 text-[#FFA116] text-[11px] font-medium hover:bg-[#FFA116]/20 transition-colors">
                      LeetCode <ExternalLink size={10} />
                    </a>
                  )}
                  {links.gfg && (
                    <a href={links.gfg} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2F8D46]/10 border border-[#2F8D46]/20 text-[#2F8D46] text-[11px] font-medium hover:bg-[#2F8D46]/20 transition-colors">
                      GeeksforGeeks <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Season Progress card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Target size={14} className="text-neon-cyan" />
                <h2 className="heading-sm !text-sm">Season Progress</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Total Contests', value: '57',           color: 'text-neon-cyan'      },
                  { label: 'Topic Weeks',    value: '28',           color: 'text-electric-blue'  },
                  { label: 'Every Saturday', value: '🗓️',           color: 'text-warning'        },
                  { label: 'Season Ends',    value: 'Aug 7, 2027',  color: 'text-gold'           },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary/60">{s.label}</span>
                    <span className={`text-xs font-numbers font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <Link to="/dashboard/roadmap"
                className="mt-4 w-full flex items-center justify-center gap-1 text-[10px] text-text-secondary hover:text-neon-cyan transition-colors border border-white/5 rounded-lg py-2">
                <BookOpen size={10} /> View Full Roadmap
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ── Upcoming Contest + Competitive Profiles ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-neon-cyan" />
            <h2 className="heading-sm !text-sm">Upcoming Contest</h2>
          </div>
          {loadingContest ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
            </div>
          ) : upcomingContest ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-white text-sm">{upcomingContest.name}</h3>
                  <p className="text-text-secondary text-xs mt-1">
                    {upcomingContest.mode} · {upcomingContest.platform ?? 'BVRIT'} · {upcomingContest.duration} min
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-warning text-[10px] shrink-0">
                  <Zap size={9} /> Upcoming
                </span>
              </div>
              <div className="bg-midnight rounded-lg p-4 text-center">
                <div className="text-text-secondary text-[10px] uppercase tracking-widest mb-1">Starts In</div>
                <CountdownTimer date={upcomingContest.date} startTime={upcomingContest.startTime} />
              </div>
              <div className="hidden sm:flex gap-3">
                {upcomingContest.contestLink && (
                  <a href={upcomingContest.contestLink} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-4">Join Contest</a>
                )}
                <Link to="/schedule" className="btn-secondary text-xs py-2 px-4">Full Schedule</Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar size={32} className="text-neon-cyan/20 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No upcoming contest scheduled.</p>
              <Link to="/schedule" className="text-neon-cyan text-xs hover:underline mt-2 inline-block">View Schedule →</Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code2 size={14} className="text-neon-cyan" />
              <h2 className="heading-sm !text-sm">My Profiles</h2>
            </div>
            <span className="text-[10px] text-text-secondary">{filledProfiles}/{PLATFORM_CFG.length}</span>
          </div>
          <div className="space-y-2.5">
            {PLATFORM_CFG.map(p => {
              const val = (participant as any)[p.key] as string | undefined;
              return (
                <div key={p.key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-text-secondary truncate">{p.label}</span>
                  </div>
                  {val ? (
                    <a href={val} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-neon-cyan hover:text-white transition-colors shrink-0">
                      View <ExternalLink size={9} />
                    </a>
                  ) : (
                    <span className="text-[10px] text-text-secondary/40 shrink-0">—</span>
                  )}
                </div>
              );
            })}
          </div>
          <Link to="/dashboard/profile"
            className="mt-4 w-full flex items-center justify-center gap-1 text-[10px] text-text-secondary hover:text-neon-cyan transition-colors border border-white/5 rounded-lg py-2">
            <User size={10} /> Edit Profile
          </Link>
        </div>
      </div>

      {/* ── Leaderboard + Announcements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 10 Leaderboard */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-neon-cyan" />
              <h2 className="heading-sm !text-sm">Top 10 Leaderboard</h2>
            </div>
            <Link to="/dashboard/leaderboard" className="text-neon-cyan text-xs hover:underline flex items-center gap-1">
              Full Board <ChevronRight size={11} />
            </Link>
          </div>
          {loadingLeader ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Trophy size={32} className="text-neon-cyan/20 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No participants yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[228px] overflow-y-auto no-scrollbar">
              {leaderboard.map((r, i) => {
                const isMe = r.uid === participant.uid;
                const emoji = rankEmoji(i + 1);
                return (
                  <div key={r.uid}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isMe ? 'bg-neon-cyan/10 border border-neon-cyan/20' : 'hover:bg-white/5'
                    }`}>
                    <div className="w-6 text-center shrink-0">
                      {emoji
                        ? <span className="text-base">{emoji}</span>
                        : <span className={`text-xs font-numbers ${rankColor(i + 1)}`}>#{i + 1}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${isMe ? 'text-neon-cyan' : 'text-white'}`}>
                        {r.fullName} {isMe && <span className="text-[10px] text-neon-cyan/70">(you)</span>}
                        {r.foundingMember && (
                          <span title="Founding Member" className="inline-block ml-1 align-middle">
                            <Crown size={10} className="text-gold" />
                          </span>
                        )}
                      </div>
                      <div className="text-text-secondary/60 text-[10px] truncate">{r.college}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-numbers text-sm font-bold ${isMe ? 'text-neon-cyan' : 'text-white'}`}>{r.rating}</div>
                      <div className="text-text-secondary/60 text-[10px]">{r.tier}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={14} className="text-neon-cyan" />
            <h2 className="heading-sm !text-sm">Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-6">
              <Megaphone size={28} className="text-neon-cyan/20 mx-auto mb-2" />
              <p className="text-text-secondary text-xs">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="border-l-2 border-neon-cyan/30 pl-3">
                  <div className="text-xs text-white font-medium leading-tight">{a.title}</div>
                  <div className="text-[10px] text-text-secondary/70 mt-0.5 line-clamp-2">{a.body}</div>
                  <div className="text-[9px] text-text-secondary/40 mt-1">
                    {(a as any).createdAt?.seconds
                      ? new Date((a as any).createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Badges + Quick Info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-neon-cyan" />
              <h2 className="heading-sm !text-sm">Badges</h2>
            </div>
            <span className="text-[10px] text-text-secondary">
              {participant.badges?.length ?? 0}/{Object.keys(BADGE_META).length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(BADGE_META) as (keyof typeof BADGE_META)[]).map(type => {
              const meta    = BADGE_META[type];
              const earned  = participant.badges?.some(b => b.type === type);
              const earnedBadge = participant.badges?.find(b => b.type === type);
              return (
                <div key={type}
                  title={earned
                    ? `${meta.label} — Earned ${earnedBadge?.awardedAt ? new Date(earnedBadge.awardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`
                    : `${meta.label} — Not yet earned`}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                    earned
                      ? 'bg-midnight border-neon-cyan/30 hover:border-neon-cyan/50'
                      : 'bg-midnight/40 border-white/5 opacity-40'
                  }`}>
                  <span className={`text-xl ${!earned ? 'grayscale' : ''}`}>{meta.emoji}</span>
                  <span className="text-[9px] text-text-secondary text-center leading-tight">{meta.label}</span>
                  {earned && <span className="text-[8px] text-neon-cyan/60">✓ earned</span>}
                </div>
              );
            })}
          </div>
          {!participant.badges?.length && (
            <p className="text-text-secondary/50 text-[10px] text-center mt-3">
              Compete in contests to unlock badges!
            </p>
          )}
        </div>

        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-neon-cyan" />
            <h2 className="heading-sm !text-sm">Quick Info</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {[
              { label: 'Full Name',  value: participant.fullName   },
              { label: 'Email',      value: participant.email      },
              { label: 'Phone',      value: participant.phone      },
              { label: 'College',    value: participant.college    },
              { label: 'Branch',     value: participant.branch     },
              { label: 'Year',       value: participant.year       },
              { label: 'University', value: participant.university },
              { label: 'City',       value: participant.city       },
              { label: 'State',      value: participant.state      },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
                <div className="text-white truncate">{value ?? '—'}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <Link to="/dashboard/profile" className="flex items-center gap-1 text-xs text-neon-cyan hover:underline">
              Edit Profile <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Results ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-neon-cyan" />
            <h2 className="heading-sm !text-sm">Recent Performances</h2>
          </div>
          <Link to="/dashboard/stats" className="text-neon-cyan text-xs hover:underline">View All →</Link>
        </div>
        {recentResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body min-w-[400px]">
              <thead>
                <tr className="border-b border-neon-cyan/10">
                  {['Contest','Rank','Score','LP','Rating Δ'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] text-text-secondary/60 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentResults.map(r => {
                  const delta = r.ratingAfter - r.ratingBefore;
                  return (
                    <tr key={r.id} className="hover:bg-neon-cyan/5 transition-colors">
                      <td className="py-3 px-3 text-white">{(r as any).contestName ?? r.contestId}</td>
                      <td className="py-3 px-3 font-numbers">
                        <span className={rankColor(r.rank)}>#{r.rank}</span>
                      </td>
                      <td className="py-3 px-3 font-numbers text-white">{r.score}</td>
                      <td className="py-3 px-3 font-numbers text-neon-cyan">{r.leaguePoints}</td>
                      <td className="py-3 px-3 font-numbers">
                        <span className={delta >= 0 ? 'text-success' : 'text-red-400'}>
                          {delta >= 0 ? '+' : ''}{delta}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy size={32} className="text-neon-cyan/20 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">No contest results yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}
