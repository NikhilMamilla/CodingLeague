import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Camera, Save, ExternalLink, Code2, User,
  GraduationCap, MapPin, Phone, Mail, Shield, Link,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BADGE_META } from '../../types';
import { extractHandle, getCanonicalProfileUrl } from '../../lib/profileVerification';

const TIER_CLASS: Record<string, string> = {
  Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
  Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
};

const TIER_NEXT_NAME: Record<string, string> = {
  Beginner: 'Explorer', Explorer: 'Coder', Coder: 'Expert',
  Expert: 'Master', Master: 'Grandmaster', Grandmaster: 'Max',
};
const TIER_MIN:  Record<string, number> = { Beginner: 0,    Explorer: 1000, Coder: 1200, Expert: 1500, Master: 1800, Grandmaster: 2200 };
const TIER_NEXT: Record<string, number> = { Beginner: 1000, Explorer: 1200, Coder: 1500, Expert: 1800, Master: 2200, Grandmaster: 9999 };

const PLATFORM_CFG = [
  { key: 'hackerrankUsername' as const, label: 'HackerRank',    color: '#00EA64', bg: 'rgba(0,234,100,0.07)',   required: true  },
  { key: 'codechefUsername'   as const, label: 'CodeChef',      color: '#B17A50', bg: 'rgba(177,122,80,0.07)',  required: true  },
  { key: 'leetcodeUsername'   as const, label: 'LeetCode',      color: '#FFA116', bg: 'rgba(255,161,22,0.07)',  required: true  },
  { key: 'codeforcesHandle'   as const, label: 'Codeforces',    color: '#1890FF', bg: 'rgba(24,144,255,0.07)',  required: false },
  { key: 'gfgUsername'        as const, label: 'GeeksforGeeks', color: '#2F8D46', bg: 'rgba(47,141,70,0.07)',   required: false },
];

function isValidUrl(v: string) {
  try { return new URL(v).protocol === 'https:'; } catch { return false; }
}

function Card({ title, icon: Icon, children, className = '' }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`card space-y-4 ${className}`}>
      <div className="flex items-center gap-2 pb-3 border-b border-neon-cyan/10">
        <div className="w-7 h-7 rounded-lg bg-neon-cyan/10 flex items-center justify-center shrink-0">
          <Icon size={13} className="text-neon-cyan" />
        </div>
        <h2 className="font-heading text-sm font-bold text-neon-cyan">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function MyProfile() {
  const { participant, user, refreshParticipant } = useAuth();

  const [bio,      setBio]      = useState(participant?.bio ?? '');
  const [github,   setGithub]   = useState(participant?.github   ?? '');
  const [linkedin, setLinkedin] = useState(participant?.linkedin ?? '');
  const [profiles, setProfiles] = useState({
    hackerrankUsername: participant?.hackerrankUsername ?? '',
    codechefUsername:   participant?.codechefUsername   ?? '',
    leetcodeUsername:   participant?.leetcodeUsername   ?? '',
    codeforcesHandle:   participant?.codeforcesHandle   ?? '',
    gfgUsername:        participant?.gfgUsername        ?? '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!participant) return;
    setBio(participant.bio ?? '');
    setGithub(participant.github ?? '');
    setLinkedin(participant.linkedin ?? '');
    setProfiles({
      hackerrankUsername: participant.hackerrankUsername ?? '',
      codechefUsername:   participant.codechefUsername   ?? '',
      leetcodeUsername:   participant.leetcodeUsername   ?? '',
      codeforcesHandle:   participant.codeforcesHandle   ?? '',
      gfgUsername:        participant.gfgUsername        ?? '',
    });
  }, [participant]);

  if (!participant || !user) return null;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2 MB'); return; }
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user!.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'participants', user!.uid), { photoURL: url });
      await refreshParticipant();
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (github.trim()   && !isValidUrl(github))   { toast.error('GitHub: enter a valid https:// URL');   setSaving(false); return; }
      if (linkedin.trim() && !isValidUrl(linkedin))  { toast.error('LinkedIn: enter a valid https:// URL'); setSaving(false); return; }

      const hrHandle = profiles.hackerrankUsername ? extractHandle('hackerrankUsername', profiles.hackerrankUsername) : null;
      const ccHandle = profiles.codechefUsername   ? extractHandle('codechefUsername',   profiles.codechefUsername)   : null;
      const lcHandle = profiles.leetcodeUsername   ? extractHandle('leetcodeUsername',   profiles.leetcodeUsername)   : null;
      const cfHandle = profiles.codeforcesHandle   ? extractHandle('codeforcesHandle',   profiles.codeforcesHandle)   : null;
      const gfgHandle= profiles.gfgUsername        ? extractHandle('gfgUsername',        profiles.gfgUsername)        : null;

      await updateDoc(doc(db, 'participants', user!.uid), {
        bio,
        github:             github   || null,
        linkedin:           linkedin || null,
        hackerrankUsername: hrHandle,
        codechefUsername:   ccHandle,
        leetcodeUsername:   lcHandle,
        codeforcesHandle:   cfHandle,
        gfgUsername:        gfgHandle,
        hackerrankUrl:      hrHandle ? getCanonicalProfileUrl('hackerrankUsername', hrHandle) : null,
        codechefUrl:        ccHandle ? getCanonicalProfileUrl('codechefUsername', ccHandle)   : null,
        leetcodeUrl:        lcHandle ? getCanonicalProfileUrl('leetcodeUsername', lcHandle)   : null,
        codeforcesUrl:      cfHandle ? getCanonicalProfileUrl('codeforcesHandle', cfHandle)   : null,
        gfgUrl:             gfgHandle ? getCanonicalProfileUrl('gfgUsername', gfgHandle)     : null,
      });
      await refreshParticipant();
      toast.success('Profile saved with verified handles!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  const tier = participant.tier;
  const tMin = TIER_MIN[tier]  ?? 0;
  const tNext = TIER_NEXT[tier] ?? 1000;
  const rPct  = tier === 'Grandmaster' ? 100 : Math.min(100, Math.round(((participant.rating - tMin) / (tNext - tMin)) * 100));

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="heading-md">My Profile</h1>
        <p className="text-text-secondary text-xs mt-1">Manage your public profile and competitive handles.</p>
      </div>

      {/* ── ROW 1: Identity card + Badges ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card title="Identity" icon={User}>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 overflow-hidden flex items-center justify-center">
                {participant.photoURL
                  ? <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span className="font-heading text-3xl text-neon-cyan font-bold">
                      {participant.fullName.charAt(0).toUpperCase()}
                    </span>
                }
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neon-cyan text-midnight flex items-center justify-center hover:bg-neon-cyan/80 transition-colors shadow-md">
                <Camera size={12} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            <div className="min-w-0">
              <div className="font-heading text-white text-base font-bold truncate">{participant.fullName}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={TIER_CLASS[tier]}>{tier}</span>
                <span className="font-numbers text-[11px] text-text-secondary bg-white/5 px-2 py-0.5 rounded">
                  {participant.participantId}
                </span>
              </div>
              <div className="text-text-secondary text-[11px] mt-1.5">{participant.college}</div>
              <div className="text-text-secondary/60 text-[10px]">{participant.branch} · {participant.year}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neon-cyan/10">
            {[
              { label: 'Rating',   value: participant.rating,               color: 'text-neon-cyan'     },
              { label: 'Contests', value: participant.contestsParticipated, color: 'text-electric-blue' },
              { label: 'Badges',   value: participant.badges?.length ?? 0,  color: 'text-gold'          },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`stat-number text-xl ${s.color}`}>{s.value}</div>
                <div className="text-text-secondary/60 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-text-secondary/50 mb-1">
              <span>Progress to {TIER_NEXT_NAME[tier] ?? 'Max'}</span>
              <span className="text-neon-cyan font-numbers">{rPct}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-neon-cyan rounded-full transition-all duration-700" style={{ width: `${rPct}%` }} />
            </div>
          </div>
        </Card>

        <Card title="Badges Earned" icon={Shield}>
          {participant.badges?.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {participant.badges.map((b: any) => {
                const badgeKey = (b.type || b.id || b.name) as keyof typeof BADGE_META;
                const meta = BADGE_META[badgeKey];
                return (
                  <div key={b.type || b.id}
                    title={`${meta?.label || b.name} — Earned ${b.awardedAt ? new Date(b.awardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-midnight border border-neon-cyan/10 hover:border-neon-cyan/30 transition-colors cursor-default">
                    <span className="text-2xl">{meta?.emoji || '🏅'}</span>
                    <span className="text-[9px] text-text-secondary text-center leading-tight">{meta?.label || b.name}</span>
                    <span className="text-[8px] text-neon-cyan/50">✓ earned</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="text-4xl mb-3">🏅</div>
              <p className="text-text-secondary text-sm font-medium">No badges yet</p>
              <p className="text-text-secondary/50 text-xs mt-1 leading-relaxed">
                Compete in contests to earn<br />achievement badges.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── ROW 2: Account Details + Bio ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card title="Account Details" icon={GraduationCap}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { icon: User,          label: 'Full Name',  value: participant.fullName   },
              { icon: Mail,          label: 'Email',      value: participant.email      },
              { icon: Phone,         label: 'Phone',      value: participant.phone      },
              { icon: GraduationCap, label: 'College',    value: participant.college    },
              { icon: GraduationCap, label: 'University', value: participant.university },
              { icon: GraduationCap, label: 'Branch',     value: participant.branch     },
              { icon: GraduationCap, label: 'Year',       value: participant.year       },
              { icon: MapPin,        label: 'City',       value: participant.city       },
              { icon: MapPin,        label: 'State',      value: participant.state      },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                  <Icon size={10} className="shrink-0" /> {label}
                </label>
                <div className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-xs truncate">
                  {value ?? '—'}
                </div>
              </div>
            ))}
          </div>
          <p className="text-text-secondary/40 text-[10px] pt-2 border-t border-white/5">
            Contact support to update personal details.
          </p>
        </Card>

        <Card title="About Me & Social Links" icon={User}>
          <div className="space-y-4">
            <div>
              <label className="input-label">Short Bio</label>
              <textarea
                className="input-field min-h-[80px] resize-none text-xs"
                placeholder="Tell fellow coders about your coding journey…"
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={300}
              />
              <span className="text-[10px] text-text-secondary/40">{bio.length}/300 characters</span>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                  <Link size={10} /> GitHub
                </label>
                <input
                  className="input-field text-xs"
                  placeholder="https://github.com/YourUsername"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                  <Link size={10} /> LinkedIn
                </label>
                <input
                  className="input-field text-xs"
                  placeholder="https://linkedin.com/in/YourProfile"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="btn-primary w-full text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2">
              <Save size={13} />
              {saving ? 'Saving…' : 'Save Bio & Social Links'}
            </button>
          </div>
        </Card>
      </div>

      {/* ── ROW 3: Competitive Profiles ── */}
      <Card title="Competitive Profiles & Handles" icon={Code2}>
        <div className="flex items-center justify-between -mt-1 mb-1">
          <p className="text-[11px] text-text-secondary/60">
            Enter your handle/username or full URL. Handles are auto-extracted & verified for 100% contest syncing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORM_CFG.slice(0, 4).map(p => {
            const val = profiles[p.key] ?? '';
            const handle = extractHandle(p.key, val);
            return (
              <div key={p.key} className="rounded-xl border border-white/8 p-4 transition-all hover:border-neon-cyan/20"
                style={{ background: p.bg }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-heading font-bold" style={{ color: p.color }}>{p.label}</span>
                    {p.required && <span className="text-red-400 text-xs">*</span>}
                  </div>
                  {handle ? (
                    <a href={getCanonicalProfileUrl(p.key, handle)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-neon-cyan hover:text-white transition-colors">
                      @{handle} <ExternalLink size={9} />
                    </a>
                  ) : (
                    <span className="text-[10px] text-text-secondary/40">not linked</span>
                  )}
                </div>
                <input
                  className="w-full bg-midnight/60 border border-white/10 text-white rounded-lg px-3 py-2.5 text-xs
                             placeholder-text-secondary/40 outline-none transition-all
                             focus:border-neon-cyan/40 focus:shadow-[0_0_8px_rgba(0,229,255,0.1)]"
                  placeholder="Enter handle or profile URL"
                  value={val}
                  onChange={e => setProfiles(prev => ({ ...prev, [p.key]: e.target.value }))}
                />
              </div>
            );
          })}
        </div>

        {/* GFG — full row */}
        {(() => {
          const p = PLATFORM_CFG[4];
          const val = profiles[p.key] ?? '';
          const handle = extractHandle(p.key, val);
          return (
            <div className="rounded-xl border border-white/8 p-4 transition-all hover:border-neon-cyan/20 mt-4"
              style={{ background: p.bg }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-heading font-bold" style={{ color: p.color }}>{p.label}</span>
                  <span className="text-text-secondary/50 text-[10px]">(optional)</span>
                </div>
                {handle ? (
                  <a href={getCanonicalProfileUrl(p.key, handle)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-neon-cyan hover:text-white transition-colors">
                    @{handle} <ExternalLink size={9} />
                  </a>
                ) : (
                  <span className="text-[10px] text-text-secondary/40">not linked</span>
                )}
              </div>
              <input
                className="w-full bg-midnight/60 border border-white/10 text-white rounded-lg px-3 py-2.5 text-xs
                           placeholder-text-secondary/40 outline-none transition-all
                           focus:border-neon-cyan/40 focus:shadow-[0_0_8px_rgba(0,229,255,0.1)]"
                placeholder="Enter handle or profile URL"
                value={val}
                onChange={e => setProfiles(prev => ({ ...prev, [p.key]: e.target.value }))}
              />
            </div>
          );
        })()}
      </Card>

      {/* ── Save profiles ── */}
      <button onClick={handleSave} disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 py-3 text-sm">
        <Save size={15} />
        {saving ? 'Saving…' : 'Save Profile & Handles'}
      </button>

    </div>
  );
}
