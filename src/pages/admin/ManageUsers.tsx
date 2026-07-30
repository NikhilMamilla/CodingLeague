import { useEffect, useState } from 'react';
import type { Participant } from '../../types';
import { BADGE_META } from '../../types';
import {
  Search, User, GraduationCap, Mail, Phone, MapPin, Code2,
  X, Shield, ExternalLink, Link2, Trash2, Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCanonicalProfileUrl } from '../../lib/profileVerification';
import { getParticipantsLatestFirst, deleteParticipant, compactParticipantIds } from '../../lib/db';

const TIER_CLASS: Record<string, string> = {
  Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
  Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
};

const PLATFORM_CFG = [
  { key: 'hackerrankUsername' as const, label: 'HackerRank', color: '#00EA64', required: true },
  { key: 'codechefUsername'   as const, label: 'CodeChef',   color: '#B17A50', required: true },
  { key: 'leetcodeUsername'   as const, label: 'LeetCode',   color: '#FFA116', required: true },
  { key: 'codeforcesHandle'   as const, label: 'Codeforces', color: '#1890FF', required: false },
  { key: 'gfgUsername'        as const, label: 'GeeksforGeeks', color: '#2F8D46', required: false },
];

export default function ManageUsers() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [viewing, setViewing] = useState<Participant | null>(null);
  const [fixing,  setFixing]  = useState(false);

  useEffect(() => {
    getParticipantsLatestFirst(500).then(data => {
      setParticipants(data.filter(p => p.role !== 'admin' && p.role !== 'super_admin'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleCompactIds() {
    const confirmed = confirm(
      `COMPACT ALL PARTICIPANT IDs\n\n` +
      `This will:\n` +
      `1. Find all participant IDs\n` +
      `2. Renumber them sequentially 1, 2, 3... (no gaps)\n` +
      `3. Set the counter to the new max\n\n` +
      `Current total: ${participants.length}\n` +
      `After compact: IDs will be CBB000001 through CBB${String(participants.length).padStart(6, '0')}\n\n` +
      `This fixes all gaps permanently. Proceed?`
    );
    if (!confirmed) return;
    setFixing(true);
    try {
      const { renamed, newMax } = await compactParticipantIds();
      toast.success(`Done! Renamed ${renamed} IDs. New max: ${newMax}. Counter set to ${newMax}.`, { duration: 5000 });
      const fresh = await getParticipantsLatestFirst(500);
      setParticipants(fresh.filter(p => p.role !== 'admin' && p.role !== 'super_admin'));
    } catch (e: any) {
      toast.error('Compact failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setFixing(false);
    }
  }

  const filtered = participants.filter(p =>
    !search ||
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.college?.toLowerCase().includes(search.toLowerCase()) ||
    p.participantId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md">Participants</h1>
          <p className="text-text-secondary text-xs mt-1">
            {participants.length} registered · updates live
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleCompactIds}
            disabled={fixing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-electric-blue/40 bg-electric-blue/10 text-electric-blue hover:bg-electric-blue/20 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Wrench size={12} />
            {fixing ? 'Compacting…' : 'Compact All IDs (Close Gaps)'}
          </button>
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
            <input className="input-field pl-9 py-2 text-xs" placeholder="Search name, email, college, ID…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body min-w-[640px]">
            <thead className="bg-[#070d1a]">
              <tr className="border-b border-neon-cyan/10">
                {['Participant', 'College', 'Branch / Year', 'Tier', 'Rating', 'Contests', 'Badges', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-text-secondary">
                  <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-text-secondary">
                  {participants.length === 0 ? 'No participants yet.' : 'No results found.'}
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.uid} className="hover:bg-neon-cyan/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {(p as any).photoURL
                          ? <img src={(p as any).photoURL} alt="" className="w-full h-full object-cover" />
                          : <span className="font-heading text-[11px] text-neon-cyan font-bold">
                              {p.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                        }
                      </div>
                      <div>
                        <div className="font-medium text-white">{p.fullName}</div>
                        <div className="text-text-secondary/60 text-[10px] font-numbers">{p.participantId} · {p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{p.college}</td>
                  <td className="px-4 py-3 text-text-secondary/70 text-xs">{p.branch} · {p.year}</td>
                  <td className="px-4 py-3">
                    <span className={TIER_CLASS[p.tier] ?? 'tier-beginner'}>{p.tier}</span>
                  </td>
                  <td className="px-4 py-3 font-numbers text-neon-cyan font-bold">{p.rating}</td>
                  <td className="px-4 py-3 font-numbers text-text-secondary">{p.contestsParticipated}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {p.badges && p.badges.length > 0 ? (
                        p.badges.map(b => {
                          const meta = BADGE_META[b.type];
                          return (
                            <span key={b.type} title={meta?.label ?? b.type} className="text-sm cursor-default">
                              {meta?.emoji ?? '🏅'}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-text-secondary/40 text-[10px]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setViewing(p)}
                        className="text-neon-cyan text-[10px] hover:underline"
                      >
                        View Profile →
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete ${p.fullName} (${p.participantId})? This removes them from Supabase. Also delete from Firebase Auth manually.`)) return;
                          try {
                            await deleteParticipant(p.uid);
                            setParticipants(prev => prev.filter(x => x.uid !== p.uid));
                            toast.success(`Deleted ${p.fullName}`);
                          } catch (e: any) { toast.error('Delete failed: ' + (e.message ?? 'Check Supabase RLS policy')); }
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete participant"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Participant Profile Modal ── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="bg-midnight border border-neon-cyan/20 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_0_40px_rgba(0,229,255,0.12)]">

            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-midnight/95 border-b border-neon-cyan/10 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 overflow-hidden flex items-center justify-center">
                  {viewing.photoURL
                    ? <img src={viewing.photoURL} alt="" className="w-full h-full object-cover" />
                    : <span className="font-heading text-xl text-neon-cyan font-bold">
                        {viewing.fullName.charAt(0).toUpperCase()}
                      </span>
                  }
                </div>
                <div>
                  <h2 className="font-heading text-sm font-bold text-white">{viewing.fullName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={TIER_CLASS[viewing.tier] ?? 'tier-beginner'}>{viewing.tier}</span>
                    <span className="font-numbers text-[11px] text-text-secondary bg-white/5 px-2 py-0.5 rounded">
                      {viewing.participantId}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="text-text-secondary hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Rating', value: viewing.rating, color: 'text-neon-cyan' },
                  { label: 'Contests', value: viewing.contestsParticipated, color: 'text-electric-blue' },
                  { label: 'Badges', value: viewing.badges?.length ?? 0, color: 'text-gold' },
                ].map(s => (
                  <div key={s.label} className="card text-center py-3">
                    <div className={`stat-number text-xl ${s.color}`}>{s.value}</div>
                    <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Account Details */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neon-cyan/10">
                  <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                    <GraduationCap size={13} className="text-neon-cyan" />
                  </div>
                  <h3 className="font-heading text-sm font-bold text-neon-cyan">Account Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: User,          label: 'Full Name',  value: viewing.fullName   },
                    { icon: Mail,          label: 'Email',      value: viewing.email      },
                    { icon: Phone,         label: 'Phone',      value: viewing.phone      },
                    { icon: GraduationCap, label: 'College',    value: viewing.college    },
                    { icon: GraduationCap, label: 'University', value: viewing.university },
                    { icon: GraduationCap, label: 'Branch',     value: viewing.branch     },
                    { icon: GraduationCap, label: 'Year',       value: viewing.year       },
                    { icon: MapPin,        label: 'City',       value: viewing.city       },
                    { icon: MapPin,        label: 'State',      value: viewing.state      },
                    { icon: Mail,          label: 'Email Verified', value: viewing.emailVerified ? 'Yes' : 'No' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                      <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                        <Icon size={10} className="shrink-0" /> {label}
                      </label>
                      <div className="text-white text-xs truncate">{value ?? '—'}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bio & Social */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neon-cyan/10">
                  <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                    <Link2 size={13} className="text-neon-cyan" />
                  </div>
                  <h3 className="font-heading text-sm font-bold text-neon-cyan">About Me & Social Links</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                    <label className="text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1 block">Short Bio</label>
                    <div className="text-white text-xs leading-relaxed whitespace-pre-wrap">{viewing.bio || 'No bio added.'}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'GitHub',   url: viewing.github   },
                      { label: 'LinkedIn', url: viewing.linkedin },
                    ].map(({ label, url }) => (
                      <div key={label} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                        <label className="text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1 block">{label}</label>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-neon-cyan text-xs flex items-center gap-1 hover:underline truncate">
                            {url} <ExternalLink size={10} />
                          </a>
                        ) : (
                          <div className="text-text-secondary/50 text-xs">Not linked</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Competitive Profiles */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neon-cyan/10">
                  <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                    <Code2 size={13} className="text-neon-cyan" />
                  </div>
                  <h3 className="font-heading text-sm font-bold text-neon-cyan">Competitive Profiles & Handles</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORM_CFG.map(p => {
                    const handle = (viewing as any)[p.key] as string | undefined;
                    const url = handle ? getCanonicalProfileUrl(p.key, handle) : null;
                    return (
                      <div key={p.key} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider mb-1.5" style={{ color: p.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.label} {p.required && <span className="text-red-400">*</span>}
                        </label>
                        {handle ? (
                          <a href={url ?? '#'} target="_blank" rel="noopener noreferrer"
                            className="text-neon-cyan text-xs flex items-center gap-1 hover:underline truncate">
                            @{handle} <ExternalLink size={10} />
                          </a>
                        ) : (
                          <div className="text-text-secondary/50 text-xs">not linked</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Badges */}
              <section>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neon-cyan/10">
                  <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                    <Shield size={13} className="text-neon-cyan" />
                  </div>
                  <h3 className="font-heading text-sm font-bold text-neon-cyan">Badges Earned</h3>
                </div>
                {viewing.badges?.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {viewing.badges.map(b => {
                      const meta = BADGE_META[b.type];
                      return (
                        <div key={b.type}
                          title={`${meta?.label || b.label} — Earned ${b.awardedAt ? new Date(b.awardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-neon-cyan/10">
                          <span className="text-xl">{meta?.emoji || b.emoji || '🏅'}</span>
                          <span className="text-[9px] text-text-secondary text-center leading-tight">{meta?.label || b.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-text-secondary/50 text-xs">No badges earned yet.</div>
                )}
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
