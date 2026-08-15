import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Camera, Save, ExternalLink, Code2, User,
  GraduationCap, MapPin, Phone, Mail, Shield, Link, Crown, Star, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BADGE_META } from '../../types';
import { extractHandle, getCanonicalProfileUrl } from '../../lib/profileVerification';
import FoundingMemberBadge from '../../components/ui/FoundingMemberBadge';
import { updateParticipant } from '../../lib/db';

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
  const [savingDetails, setSavingDetails] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Editable account detail fields
  const [college,    setCollege]    = useState(participant?.college    ?? '');
  const [university, setUniversity] = useState(participant?.university ?? '');
  const [branch,     setBranch]     = useState(participant?.branch     ?? '');
  const [year,       setYear]       = useState(participant?.year       ?? '');
  const [city,       setCity]       = useState(participant?.city       ?? '');
  const [state,      setState]      = useState(participant?.state      ?? '');
  const [phone,      setPhone]      = useState(participant?.phone      ?? '');

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
    setCollege(participant.college    ?? '');
    setUniversity(participant.university ?? '');
    setBranch(participant.branch     ?? '');
    setYear(participant.year         ?? '');
    setCity(participant.city         ?? '');
    setState(participant.state       ?? '');
    setPhone(participant.phone       ?? '');
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
      await updateParticipant(user!.uid, { photo_url: url });
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

      await updateParticipant(user!.uid, {
        bio,
        github:             github   || null,
        linkedin:           linkedin || null,
        hackerrank_username: hrHandle,
        codechef_username:   ccHandle,
        leetcode_username:   lcHandle,
        codeforces_handle:   cfHandle,
        gfg_username:        gfgHandle,
        hackerrank_url:      hrHandle ? getCanonicalProfileUrl('hackerrankUsername', hrHandle) : null,
        codechef_url:        ccHandle ? getCanonicalProfileUrl('codechefUsername', ccHandle)   : null,
        leetcode_url:        lcHandle ? getCanonicalProfileUrl('leetcodeUsername', lcHandle)   : null,
        codeforces_url:      cfHandle ? getCanonicalProfileUrl('codeforcesHandle', cfHandle)   : null,
        gfg_url:             gfgHandle ? getCanonicalProfileUrl('gfgUsername', gfgHandle)     : null,
      });
      await refreshParticipant();
      toast.success('Profile saved with verified handles!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  async function handleSaveDetails() {
    setSavingDetails(true);
    try {
      await updateParticipant(user!.uid, {
        college:    college.trim().toUpperCase()    || null,
        university: university.trim().toUpperCase() || null,
        branch:     branch.trim().toUpperCase()     || null,
        year:       year                            || null,
        city:       city.trim()                     || null,
        state:      state.trim()                    || null,
        phone:      phone.trim()                    || null,
      });
      await refreshParticipant();
      toast.success('Details saved!');
    } catch { toast.error('Save failed'); }
    finally { setSavingDetails(false); }
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

      {/* ── ROW 1: Identity card (single card) ── */}
      <Card title="Identity" icon={User}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className={`w-20 h-20 rounded-full bg-neon-cyan/10 overflow-hidden flex items-center justify-center ${participant.foundingMember ? 'founding-avatar' : 'border-2 border-neon-cyan/30'}`}>
              {participant.photoURL
                ? <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className={`font-heading text-3xl font-bold ${participant.foundingMember ? 'text-gold' : 'text-neon-cyan'}`}>
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
          <div className="min-w-0 flex-1 w-full">
            <div className="font-heading text-white text-base font-bold truncate">{participant.fullName}</div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 flex-wrap">
              <span className={TIER_CLASS[tier]}>{tier}</span>
              <span className="font-numbers text-[11px] text-text-secondary bg-white/5 px-2 py-0.5 rounded">
                {participant.participantId}
              </span>
              {participant.foundingMember && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gold/10 border border-gold/30 text-gold text-[10px] font-medium">
                  <Crown size={10} /> Founding Member #{participant.foundingRank}
                </span>
              )}
            </div>
            <div className="text-text-secondary text-[11px] mt-1.5 truncate">{participant.college}</div>
            <div className="text-text-secondary/60 text-[10px] truncate">{participant.branch} · {participant.year}</div>
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

      {/* ── ROW 2: Founding Member Badge + Badges Earned (side by side) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{participant.foundingMember && (
          <Card title="Founding Member" icon={Crown} className="border-gold/20">
            <div className="flex flex-col items-center text-center">
              <FoundingMemberBadge size={160} />
              <p className="text-gold text-xs font-medium mt-3">
                #{participant.foundingRank} of the inaugural season
              </p>
              <p className="text-text-secondary/60 text-[10px] mt-1">
                Awarded {participant.foundingAwardedAt ? new Date(participant.foundingAwardedAt).toLocaleDateString('en-IN') : ''}
              </p>
            </div>
          </Card>
        )}

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

      {/* ── ROW 3: Account Details + Bio ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card title="Account Details" icon={GraduationCap}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">

            {/* Full Name — locked */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <User size={10} className="shrink-0" /> Full Name
                <span title="Contact support to update" className="ml-auto text-text-secondary/40 cursor-default"><Lock size={9} /></span>
              </label>
              <div className="w-full bg-white/5 border border-white/10 text-text-secondary/70 rounded-lg px-3 py-2 text-xs truncate">
                {participant.fullName ?? '—'}
              </div>
            </div>

            {/* Email — locked */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <Mail size={10} className="shrink-0" /> Email
                <span title="Contact support to update" className="ml-auto text-text-secondary/40 cursor-default"><Lock size={9} /></span>
              </label>
              <div className="w-full bg-white/5 border border-white/10 text-text-secondary/70 rounded-lg px-3 py-2 text-xs truncate">
                {participant.email ?? '—'}
              </div>
            </div>

            {/* College */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <GraduationCap size={10} className="shrink-0" /> College
              </label>
              <input className="input-field text-xs py-2" value={college} onChange={e => setCollege(e.target.value.toUpperCase())} placeholder="e.g. BVRIT" style={{ textTransform: 'uppercase' }} />
            </div>

            {/* University */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <GraduationCap size={10} className="shrink-0" /> University
              </label>
              <input className="input-field text-xs py-2" value={university} onChange={e => setUniversity(e.target.value.toUpperCase())} placeholder="e.g. JNTUH" style={{ textTransform: 'uppercase' }} />
            </div>

            {/* Branch */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <GraduationCap size={10} className="shrink-0" /> Branch
              </label>
              <input className="input-field text-xs py-2" value={branch} onChange={e => setBranch(e.target.value.toUpperCase())} placeholder="e.g. CSE, ECE" style={{ textTransform: 'uppercase' }} />
            </div>

            {/* Year */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <GraduationCap size={10} className="shrink-0" /> Year
              </label>
              <select className="input-field text-xs py-2" value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <MapPin size={10} className="shrink-0" /> City
              </label>
              <input className="input-field text-xs py-2" value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
            </div>

            {/* State */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <MapPin size={10} className="shrink-0" /> State
              </label>
              <input className="input-field text-xs py-2" value={state} onChange={e => setState(e.target.value)} placeholder="State" />
            </div>

            {/* Phone */}
            <div className="col-span-1 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary/60 uppercase tracking-wider mb-1">
                <Phone size={10} className="shrink-0" /> Phone
              </label>
              <input className="input-field text-xs py-2" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
            </div>

          </div>

          <button
            onClick={handleSaveDetails}
            disabled={savingDetails}
            className="btn-primary w-full text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
          >
            <Save size={13} />
            {savingDetails ? 'Saving…' : 'Save Details'}
          </button>
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

      {/* ── ROW 4: Competitive Profiles ── */}
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
              <div key={p.key} className="rounded-xl border border-white/8 p-4 transition-all hover:border-neon-cyan/20 overflow-hidden"
                style={{ background: p.bg }}>
                <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-heading font-bold truncate" style={{ color: p.color }}>{p.label}</span>
                    {p.required && <span className="text-red-400 text-xs shrink-0">*</span>}
                  </div>
                  {handle ? (
                    <a href={getCanonicalProfileUrl(p.key, handle)} target="_blank" rel="noopener noreferrer"
                      title={`@${handle}`}
                      className="flex items-center gap-1 text-[10px] text-neon-cyan hover:text-white transition-colors min-w-0 max-w-[120px] xs:max-w-[150px] sm:max-w-[180px] shrink">
                      <span className="truncate">@{handle}</span>
                      <ExternalLink size={9} className="shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-text-secondary/40 shrink-0">not linked</span>
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
            <div className="rounded-xl border border-white/8 p-4 transition-all hover:border-neon-cyan/20 mt-4 overflow-hidden"
              style={{ background: p.bg }}>
              <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-heading font-bold truncate" style={{ color: p.color }}>{p.label}</span>
                  <span className="text-text-secondary/50 text-[10px] shrink-0">(optional)</span>
                </div>
                {handle ? (
                  <a href={getCanonicalProfileUrl(p.key, handle)} target="_blank" rel="noopener noreferrer"
                    title={`@${handle}`}
                    className="flex items-center gap-1 text-[10px] text-neon-cyan hover:text-white transition-colors min-w-0 max-w-[140px] xs:max-w-[180px] sm:max-w-[240px] shrink">
                    <span className="truncate">@{handle}</span>
                    <ExternalLink size={9} className="shrink-0" />
                  </a>
                ) : (
                  <span className="text-[10px] text-text-secondary/40 shrink-0">not linked</span>
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

      {/* ── Achievements Timeline ── */}
      {participant.foundingMember && (
        <Card title="Achievements" icon={Star}>
          <div className="relative pl-4 border-l-2 border-gold/30 space-y-4">
            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gold border-2 border-midnight" />
              <div className="text-gold text-xs font-bold">Founding Member</div>
              <div className="text-text-secondary/60 text-[10px]">
                Season {participant.foundingSeasonId || '2026–27'} · Rank #{participant.foundingRank}
              </div>
              <div className="text-text-secondary/40 text-[10px]">
                {participant.foundingAwardedAt ? new Date(participant.foundingAwardedAt).toLocaleDateString('en-IN') : ''}
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
