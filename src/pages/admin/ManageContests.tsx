import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Contest, ContestMode, ContestStatus, ContestDifficulty } from '../../types';
import {
  Plus, Trash2, Calendar, X, Clock, Archive,
  Edit, Link as LinkIcon, Copy, Megaphone, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getContests, insertContest, updateContest, insertAnnouncement, invalidateContestsCache } from '../../lib/db';

const EMPTY = {
  name: '', weekNumber: '', mode: 'Online' as ContestMode,
  date: '', startTime: '', endTime: '', duration: '120',
  platform: 'HackerRank', contestLink: '', venue: '',
  problemSetter: '', instructions: '', difficulty: 'Easy' as ContestDifficulty,
};

const STATUS_COLOR: Record<ContestStatus, string> = {
  Upcoming:  'bg-warning/10  text-warning  border-warning/30',
  Active:    'bg-success/10  text-success  border-success/30 animate-pulse',
  Completed: 'bg-white/5     text-text-secondary border-white/10',
};

const STATUS_ICON: Record<ContestStatus, React.ElementType> = {
  Upcoming: Clock, Active: Zap, Completed: Archive,
};

export default function ManageContests() {
  const { participant, user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter,   setFilter]   = useState<ContestStatus | 'All'>('All');
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  // Edit Contest State
  const [editingContest, setEditingContest] = useState<Contest | null>(null);

  // Quick Link Editor Modal State
  const [linkModalContest, setLinkModalContest] = useState<Contest | null>(null);
  const [inputLink, setInputLink] = useState('');

  // Activation & Broadcast Modal State
  const [activatingContest, setActivatingContest] = useState<Contest | null>(null);
  const [activateLink, setActivateLink] = useState('');
  const [sendAnnouncement, setSendAnnouncement] = useState(true);

  useEffect(() => {
    setLoading(true);
    getContests().then(list => { setContests(list); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // ── Auto status transitions ────────────────────────────────────────────────
  // Checks every 30 seconds:
  //   Upcoming → Active    when current time >= contest date + startTime && current time < contest date + endTime
  //   Active   → Completed when current time >= contest date + endTime
  useEffect(() => {
    async function checkAndTransition() {
      const now = new Date();

      setContests(prev => {
        const toUpdate: { id: string; newStatus: 'Active' | 'Completed' }[] = [];

        const next = prev.map(c => {
          if (c.status === 'Completed') return c;

          const startDt = new Date(`${c.date}T${c.startTime}`);
          const endDt   = new Date(`${c.date}T${c.endTime}`);

          if (c.status === 'Upcoming' && now >= startDt && now < endDt) {
            toUpdate.push({ id: c.id, newStatus: 'Active' });
            return { ...c, status: 'Active' as const };
          }

          // Only auto-complete contests that are currently ACTIVE.
          // Do NOT auto-complete UPCOMING contests automatically, so admins can activate them or upload links later in the day.
          if (c.status === 'Active' && now >= endDt) {
            toUpdate.push({ id: c.id, newStatus: 'Completed' });
            return { ...c, status: 'Completed' as const };
          }

          return c;
        });

        // Persist the changes asynchronously (fire-and-forget inside the setter)
        for (const { id, newStatus } of toUpdate) {
          updateContest(id, { status: newStatus } as any)
            .then(() => {
              invalidateContestsCache();
              if (newStatus === 'Active') toast.success('Contest is now LIVE — auto-activated!');
              if (newStatus === 'Completed') toast('Contest auto-marked as Completed.', { icon: '🏁' });
            })
            .catch(err => console.error('Auto-transition failed:', err));
        }

        return toUpdate.length > 0 ? next : prev;
      });
    }

    // Run immediately on mount, then every 30 seconds
    checkAndTransition();
    const timer = setInterval(checkAndTransition, 30_000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  // Create Contest
  async function handleCreate() {
    if (!form.name || !form.date || !form.startTime || !form.endTime) {
      toast.error('Fill in all required fields'); return;
    }
    if (form.mode === 'Online' && !form.contestLink) {
      toast.error('Contest link is recommended for online contests');
    }
    if (form.mode === 'Offline' && !form.venue) {
      toast.error('Venue is required for offline contests'); return;
    }
    setSaving(true);
    try {
      await insertContest({
        name: form.name, contestNumber: contests.length + 1,
        weekNumber: parseInt(form.weekNumber) || contests.length + 1, mode: form.mode,
        date: form.date, startTime: form.startTime, endTime: form.endTime,
        duration: parseInt(form.duration) || 120,
        platform: form.platform || undefined,
        contestLink: form.contestLink || undefined,
        venue: form.venue || undefined,
        problemSetter: form.problemSetter || undefined,
        instructions: form.instructions || undefined,
        status: 'Upcoming' as ContestStatus, seasonId: 'cwcl-2026-27',
        difficulty: form.difficulty, createdAt: new Date().toISOString(),
      } as any);
      invalidateContestsCache();
      const refreshed = await getContests();
      setContests(refreshed);
      toast.success('Contest created successfully!');
      setForm(EMPTY);
      setShowCreateModal(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  // Update Contest
  async function handleUpdate() {
    if (!editingContest) return;
    setSaving(true);
    try {
      await updateContest(editingContest.id, {
        name: editingContest.name, weekNumber: Number(editingContest.weekNumber) || 1,
        mode: editingContest.mode, date: editingContest.date,
        startTime: editingContest.startTime, endTime: editingContest.endTime,
        duration: Number(editingContest.duration) || 120,
        difficulty: editingContest.difficulty,
        platform: editingContest.platform || undefined,
        contestLink: editingContest.contestLink || undefined,
        venue: editingContest.venue || undefined,
        problemSetter: editingContest.problemSetter || undefined,
        instructions: editingContest.instructions || undefined,
      } as any);
      invalidateContestsCache();
      setContests(prev => prev.map(c => c.id === editingContest.id ? { ...c, ...editingContest } : c));
      toast.success('Contest updated successfully!');
      setEditingContest(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update contest');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveQuickLink() {
    if (!linkModalContest) return;
    try {
      await updateContest(linkModalContest.id, { contestLink: inputLink.trim() || null } as any);
      invalidateContestsCache();
      setContests(prev => prev.map(c => c.id === linkModalContest.id ? { ...c, contestLink: inputLink.trim() || undefined } : c));
      toast.success('Contest link saved!');
      setLinkModalContest(null);
    } catch { toast.error('Failed to save contest link'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contest? Cannot be undone.')) return;
    try {
      await import('../../lib/db').then(m => m.deleteContest(id));
      invalidateContestsCache();
      setContests(prev => prev.filter(c => c.id !== id));
      toast.success('Contest deleted');
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleStatusSelect(c: Contest, newStatus: ContestStatus) {
    if (newStatus === 'Active') {
      setActivatingContest(c); setActivateLink(c.contestLink || ''); setSendAnnouncement(true);
      return;
    }
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'Upcoming') {
        const now = new Date();
        const endDt = new Date(`${c.date}T${c.endTime}`);
        if (now >= endDt) {
          updates.endTime = '23:59';
        }
      }
      await updateContest(c.id, updates);
      invalidateContestsCache();
      setContests(prev => prev.map(x => x.id === c.id ? { ...x, ...updates } : x));
      toast.success(`Contest marked as ${newStatus}`);
    } catch (e: any) { toast.error(e.message); }
  }

  async function confirmActivation() {
    if (!activatingContest) return;
    if (activatingContest.mode === 'Online' && !activateLink.trim()) {
      toast.error('Please enter the Contest Link before marking as Active!'); return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const endDt = new Date(`${activatingContest.date}T${activatingContest.endTime}`);
      let newEndTime = activatingContest.endTime;
      if (now >= endDt) {
        newEndTime = '23:59';
      }

      await updateContest(activatingContest.id, {
        status: 'Active',
        endTime: newEndTime,
        contestLink: activateLink.trim() || null
      } as any);
      invalidateContestsCache();

      setContests(prev => prev.map(c => c.id === activatingContest.id ? {
        ...c,
        status: 'Active' as const,
        endTime: newEndTime,
        contestLink: activateLink.trim() || undefined
      } : c));

      if (sendAnnouncement) {
        await insertAnnouncement({
          title: `🚨 LIVE MATCH: ${activatingContest.name}`,
          body: `The CWCL contest is officially LIVE NOW!\n\nPlatform: ${activatingContest.platform || 'Online'}\n${activateLink.trim() ? `Join Contest Link: ${activateLink.trim()}\n\n` : ''}Click the link to enter the match and compete! Good luck participants!`,
          category: 'Contest',
          createdBy: participant?.fullName || user?.email || 'Admin',
          createdAt: new Date().toISOString(),
        });
        toast.success('Live Match Announcement broadcasted!');
      }
      toast.success('Contest is now LIVE & ACTIVE!');
      setActivatingContest(null);
    } catch (e: any) { toast.error(e.message || 'Activation failed'); }
    finally { setSaving(false); }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Contest link copied to clipboard!');
  }

  const filtered = filter === 'All' ? contests : contests.filter(c => c.status === filter);

  const counts = {
    All:       contests.length,
    Upcoming:  contests.filter(c => c.status === 'Upcoming').length,
    Active:    contests.filter(c => c.status === 'Active').length,
    Completed: contests.filter(c => c.status === 'Completed').length,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md flex items-center gap-2">
            <Calendar className="text-neon-cyan" size={24} />
            Contest Management
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            Manage schedule, issue platform links, and activate live league matches.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY);
            setShowCreateModal(true);
          }}
          className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
        >
          <Plus size={14} /> Create Contest
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {(['All', 'Active', 'Upcoming', 'Completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-xs font-body transition-all ${
              filter === s
                ? 'bg-neon-cyan text-midnight font-bold shadow-md'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {s === 'Active' && <Zap size={12} className="inline mr-1 text-success animate-pulse" />}
            {s} <span className="ml-1 opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Contest List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar size={40} className="text-neon-cyan/20 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No contests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const Icon = STATUS_ICON[c.status] ?? Clock;
            return (
              <div key={c.id} className="card hover:border-neon-cyan/30 transition-all border border-white/10 p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      c.status === 'Active'
                        ? 'bg-success/20 border-success/40 text-success animate-pulse'
                        : 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan'
                    }`}>
                      <Icon size={18} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-white text-base font-bold">{c.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_COLOR[c.status]}`}>
                          {c.status === 'Active' ? '🔴 LIVE NOW' : c.status}
                        </span>
                        <span className="text-text-secondary/70 text-[10px] border border-white/10 rounded px-2 py-0.5 bg-midnight">
                          {c.mode}
                        </span>
                      </div>

                      <div className="text-text-secondary text-xs space-y-0.5">
                        <div>📅 {c.date} · {c.startTime} – {c.endTime} ({c.duration} min)</div>
                        {c.mode === 'Online' && c.platform && <div>🖥️ Platform: <span className="text-white font-semibold">{c.platform}</span></div>}
                        {c.mode === 'Offline' && c.venue && <div>📍 Venue: <span className="text-white font-semibold">{c.venue}</span></div>}
                        {c.problemSetter && <div>👤 Problem Setter: {c.problemSetter}</div>}
                      </div>

                      {/* Contest Link Section */}
                      <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                        {c.contestLink ? (
                          <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg px-2.5 py-1">
                            <LinkIcon size={12} className="text-neon-cyan" />
                            <a
                              href={c.contestLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neon-cyan text-xs font-mono font-bold hover:underline max-w-xs truncate"
                              title={c.contestLink}
                            >
                              {c.contestLink}
                            </a>
                            <button
                              onClick={() => copyToClipboard(c.contestLink!)}
                              className="text-text-secondary hover:text-white p-0.5"
                              title="Copy Link"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-400/80 italic bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                            ⚠️ No Contest Link Set
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setLinkModalContest(c);
                            setInputLink(c.contestLink || '');
                          }}
                          className="text-[11px] text-neon-cyan hover:underline font-semibold flex items-center gap-1"
                        >
                          <Edit size={11} /> {c.contestLink ? 'Edit Link' : '+ Add Contest Link'}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-col sm:items-end shrink-0 pt-2 sm:pt-0">
                    
                    {/* Status Dropdown */}
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-text-secondary block">Contest Status</span>
                      <select
                        value={c.status}
                        onChange={e => handleStatusSelect(c, e.target.value as ContestStatus)}
                        className={`bg-midnight border text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer ${
                          c.status === 'Active'
                            ? 'border-success text-success bg-success/10'
                            : 'border-white/10 text-white focus:border-neon-cyan/40'
                        }`}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Active">Active (LIVE)</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {/* Edit Contest */}
                      <button
                        onClick={() => setEditingContest(c)}
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 transition-colors"
                        title="Edit Full Contest Details"
                      >
                        <Edit size={12} /> Edit
                      </button>

                      {/* Delete Contest */}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg px-2.5 py-1.5 transition-colors"
                        title="Delete Contest"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: Create Contest ── */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card border-neon-cyan/30 max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-heading text-neon-cyan text-sm font-bold flex items-center gap-2">
                <Plus size={16} /> Create New Contest
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="input-label">Contest Name *</label>
                <input className="input-field" placeholder="CWCL Week 1 — August 2026" value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Week Number</label>
                  <input className="input-field" type="number" min="1" value={form.weekNumber} onChange={e => setField('weekNumber', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Mode *</label>
                  <select className="input-field" value={form.mode} onChange={e => setField('mode', e.target.value)}>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Difficulty *</label>
                  <select className="input-field" value={form.difficulty} onChange={e => setField('difficulty', e.target.value)}>
                    <option value="Easy">Easy (1.0x)</option>
                    <option value="Medium">Medium (1.1x)</option>
                    <option value="Hard">Hard (1.2x)</option>
                    <option value="Special">Special (1.3x)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Date *</label>
                  <input className="input-field" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Duration (minutes)</label>
                  <input className="input-field" type="number" value={form.duration} onChange={e => setField('duration', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Start Time *</label>
                  <input className="input-field" type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">End Time *</label>
                  <input className="input-field" type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
                </div>
              </div>

              {form.mode === 'Online' ? (
                <>
                  <div>
                    <label className="input-label">Platform (HackerRank, Unstop, LeetCode, Codeforces)</label>
                    <input className="input-field" placeholder="e.g. HackerRank / Unstop" value={form.platform} onChange={e => setField('platform', e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label font-bold text-neon-cyan">Contest Platform URL (Link for Participants)</label>
                    <input className="input-field border-neon-cyan/40 font-mono text-neon-cyan" placeholder="https://unstop.com/o/..." value={form.contestLink} onChange={e => setField('contestLink', e.target.value)} />
                  </div>
                </>
              ) : (
                <div>
                  <label className="input-label">Venue *</label>
                  <input className="input-field" placeholder="BVRIT Lab Block, Room 204" value={form.venue} onChange={e => setField('venue', e.target.value)} />
                </div>
              )}

              <div>
                <label className="input-label">Problem Setter</label>
                <input className="input-field" placeholder="Organiser / Setter Name" value={form.problemSetter} onChange={e => setField('problemSetter', e.target.value)} />
              </div>

              <div>
                <label className="input-label">Instructions</label>
                <textarea className="input-field h-16 resize-none" placeholder="Any special rules or instructions…" value={form.instructions} onChange={e => setField('instructions', e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 text-xs disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Contest'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 2: Edit Contest ── */}
      {editingContest && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card border-neon-cyan/30 max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-heading text-neon-cyan text-sm font-bold flex items-center gap-2">
                <Edit size={16} /> Edit Contest: {editingContest.name}
              </h2>
              <button onClick={() => setEditingContest(null)} className="text-text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="input-label">Contest Name *</label>
                <input
                  className="input-field"
                  value={editingContest.name}
                  onChange={e => setEditingContest({ ...editingContest, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Week Number</label>
                  <input
                    className="input-field"
                    type="number"
                    value={editingContest.weekNumber || 1}
                    onChange={e => setEditingContest({ ...editingContest, weekNumber: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="input-label">Mode *</label>
                  <select
                    className="input-field"
                    value={editingContest.mode}
                    onChange={e => {
                      const newMode = e.target.value as ContestMode;
                      if (newMode === 'Online') {
                        // switching to Online — clear offline-only fields
                        setEditingContest({
                          ...editingContest,
                          mode: newMode,
                          venue: undefined,
                        });
                      } else {
                        // switching to Offline — clear online-only fields
                        setEditingContest({
                          ...editingContest,
                          mode: newMode,
                          platform: undefined,
                          contestLink: undefined,
                        });
                      }
                    }}
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Difficulty *</label>
                  <select
                    className="input-field"
                    value={editingContest.difficulty || 'Easy'}
                    onChange={e => setEditingContest({ ...editingContest, difficulty: e.target.value as ContestDifficulty })}
                  >
                    <option value="Easy">Easy (1.0x)</option>
                    <option value="Medium">Medium (1.1x)</option>
                    <option value="Hard">Hard (1.2x)</option>
                    <option value="Special">Special (1.3x)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Date *</label>
                  <input
                    className="input-field"
                    type="date"
                    value={editingContest.date}
                    onChange={e => setEditingContest({ ...editingContest, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Duration (min)</label>
                  <input
                    className="input-field"
                    type="number"
                    value={editingContest.duration}
                    onChange={e => setEditingContest({ ...editingContest, duration: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Start Time *</label>
                  <input
                    className="input-field"
                    type="time"
                    value={editingContest.startTime}
                    onChange={e => setEditingContest({ ...editingContest, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">End Time *</label>
                  <input
                    className="input-field"
                    type="time"
                    value={editingContest.endTime}
                    onChange={e => setEditingContest({ ...editingContest, endTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Mode-specific fields */}
              <div className={`space-y-3 rounded-xl border p-3 transition-all ${
                editingContest.mode === 'Online'
                  ? 'border-neon-cyan/30 bg-neon-cyan/5'
                  : 'border-amber-400/30 bg-amber-400/5'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  editingContest.mode === 'Online' ? 'text-neon-cyan' : 'text-amber-400'
                }`}>
                  {editingContest.mode === 'Online' ? '🖥️ Online Contest Details' : '📍 Offline Contest Details'}
                </p>

                {editingContest.mode === 'Online' ? (
                  <>
                    <div>
                      <label className="input-label">Platform (HackerRank, Unstop, LeetCode, Codeforces)</label>
                      <input
                        className="input-field"
                        placeholder="e.g. HackerRank / Unstop"
                        value={editingContest.platform || ''}
                        onChange={e => setEditingContest({ ...editingContest, platform: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label text-neon-cyan font-bold">Contest Platform URL (Link for Participants)</label>
                      <input
                        className="input-field font-mono text-neon-cyan border-neon-cyan/40"
                        placeholder="https://unstop.com/o/..."
                        value={editingContest.contestLink || ''}
                        onChange={e => setEditingContest({ ...editingContest, contestLink: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="input-label">Venue *</label>
                    <input
                      className="input-field border-amber-400/40"
                      placeholder="BVRIT Lab Block, Room 204"
                      value={editingContest.venue || ''}
                      onChange={e => setEditingContest({ ...editingContest, venue: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="input-label">Problem Setter</label>
                <input
                  className="input-field"
                  value={editingContest.problemSetter || ''}
                  onChange={e => setEditingContest({ ...editingContest, problemSetter: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label">Instructions</label>
                <textarea
                  className="input-field h-16 resize-none"
                  value={editingContest.instructions || ''}
                  onChange={e => setEditingContest({ ...editingContest, instructions: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setEditingContest(null)} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1 text-xs disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 3: Quick Edit Contest Link ── */}
      {linkModalContest && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card border-neon-cyan/30 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-heading text-neon-cyan text-sm font-bold flex items-center gap-2">
                <LinkIcon size={16} /> Update Contest Link
              </h3>
              <button onClick={() => setLinkModalContest(null)} className="text-text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-text-secondary">
                Contest: <span className="text-white font-bold">{linkModalContest.name}</span>
              </p>
              <div>
                <label className="input-label font-bold text-neon-cyan">Contest Platform URL *</label>
                <input
                  className="input-field font-mono text-xs text-neon-cyan border-neon-cyan/50 focus:border-neon-cyan"
                  placeholder="https://unstop.com/o/..."
                  value={inputLink}
                  onChange={e => setInputLink(e.target.value)}
                />
                <p className="text-[10px] text-text-secondary mt-1">
                  This link will be visible to all students on their dashboard to enter the live match.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setLinkModalContest(null)} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button onClick={handleSaveQuickLink} className="btn-primary flex-1 text-xs">
                Save Link
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 4: Activate & Broadcast Live Match ── */}
      {activatingContest && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card border-success/40 bg-success/5 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-success/20 pb-3">
              <h3 className="font-heading text-success text-sm font-bold flex items-center gap-2">
                <Zap size={18} className="animate-pulse" /> Activate Live Contest
              </h3>
              <button onClick={() => setActivatingContest(null)} className="text-text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-white font-semibold">
                You are marking <span className="text-success font-bold">{activatingContest.name}</span> as <span className="text-success font-bold uppercase">LIVE ACTIVE</span>.
              </p>

              <div>
                <label className="input-label font-bold text-neon-cyan">Contest Platform URL (Link for Participants) *</label>
                <input
                  className="input-field font-mono text-neon-cyan border-neon-cyan/50"
                  placeholder="https://unstop.com/o/..."
                  value={activateLink}
                  onChange={e => setActivateLink(e.target.value)}
                />
                <p className="text-[10px] text-text-secondary mt-1">
                  Students will see a prominent "JOIN LIVE MATCH" banner on their dashboard.
                </p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-midnight/80 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendAnnouncement}
                  onChange={e => setSendAnnouncement(e.target.checked)}
                  className="mt-0.5 accent-[#00E5FF]"
                />
                <div>
                  <span className="text-white font-bold flex items-center gap-1">
                    <Megaphone size={12} className="text-neon-cyan" /> Broadcast Announcement to All Users
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">
                    Automatically publishes a live announcement with the contest link in everyone's announcement feed!
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-3 border-t border-white/10">
              <button onClick={() => setActivatingContest(null)} className="btn-secondary flex-1 text-xs">Cancel</button>
              <button
                onClick={confirmActivation}
                disabled={saving}
                className="bg-success hover:bg-success/90 text-midnight font-bold rounded-lg px-4 py-2 text-xs flex-1 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Zap size={14} /> Make Active Now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
