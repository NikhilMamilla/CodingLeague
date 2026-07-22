import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Contest, ContestMode, ContestStatus } from '../../types';
import { Plus, Trash2, Calendar, X, CheckCircle, Clock, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '', weekNumber: '', mode: 'Online' as ContestMode,
  date: '', startTime: '', endTime: '', duration: '120',
  platform: 'Codeforces', contestLink: '', venue: '',
  problemSetter: '', instructions: '',
};

const STATUS_COLOR: Record<ContestStatus, string> = {
  Upcoming:  'bg-warning/10  text-warning  border-warning/30',
  Active:    'bg-success/10  text-success  border-success/30',
  Completed: 'bg-white/5     text-text-secondary border-white/10',
};

const STATUS_ICON: Record<ContestStatus, React.ElementType> = {
  Upcoming: Clock, Active: CheckCircle, Completed: Archive,
};

export default function ManageContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter,   setFilter]   = useState<ContestStatus | 'All'>('All');
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'contests'), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setContests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contest)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleCreate() {
    if (!form.name || !form.date || !form.startTime || !form.endTime) {
      toast.error('Fill in all required fields'); return;
    }
    if (form.mode === 'Online' && !form.contestLink) { toast.error('Contest link required for online'); return; }
    if (form.mode === 'Offline' && !form.venue)      { toast.error('Venue required for offline'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'contests'), {
        name:          form.name,
        contestNumber: contests.length + 1,
        weekNumber:    parseInt(form.weekNumber) || contests.length + 1,
        mode:          form.mode,
        date:          form.date,
        startTime:     form.startTime,
        endTime:       form.endTime,
        duration:      parseInt(form.duration) || 120,
        platform:      form.platform || null,
        contestLink:   form.contestLink || null,
        venue:         form.venue || null,
        problemSetter: form.problemSetter || null,
        instructions:  form.instructions || null,
        status:        'Upcoming' as ContestStatus,
        seasonId:      'cwcl-2026-27',
        createdAt:     serverTimestamp(),
      });
      toast.success('Contest created!');
      setForm(EMPTY);
      setShowForm(false);
      // no need to call load() — onSnapshot auto-updates
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contest? Cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'contests', id));
      toast.success('Contest deleted');
      // onSnapshot will automatically remove it from state
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleStatusChange(id: string, status: ContestStatus) {
    try {
      await updateDoc(doc(db, 'contests', id), { status });
      // onSnapshot will automatically update state
      toast.success(`Marked as ${status}`);
    } catch (e: any) { toast.error(e.message); }
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
          <h1 className="heading-md">Contests</h1>
          <p className="text-text-secondary text-xs mt-1">{contests.length} contests in CWCL 2026–27</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2">
          <Plus size={14} /> Create Contest
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {(['All', 'Upcoming', 'Active', 'Completed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-xs font-body transition-all ${
              filter === s
                ? 'bg-neon-cyan text-midnight font-bold'
                : 'text-text-secondary hover:text-white'
            }`}>
            {s} <span className="ml-1 opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Contest list */}
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
              <div key={c.id} className="card hover:border-neon-cyan/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={15} className="text-neon-cyan" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-heading text-white text-sm font-bold">{c.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${STATUS_COLOR[c.status]}`}>
                          {c.status}
                        </span>
                        <span className="text-text-secondary/50 text-[10px] border border-white/10 rounded px-1.5 py-0.5">
                          {c.mode}
                        </span>
                      </div>
                      <div className="text-text-secondary text-xs space-y-0.5">
                        <div>📅 {c.date} · {c.startTime} – {c.endTime} · {c.duration} min</div>
                        {c.mode === 'Online' && c.platform && <div>🖥️ {c.platform}</div>}
                        {c.mode === 'Offline' && c.venue && <div>📍 {c.venue}</div>}
                        {c.problemSetter && <div>👤 Problem Setter: {c.problemSetter}</div>}
                      </div>
                      {c.contestLink && (
                        <a href={c.contestLink} target="_blank" rel="noopener noreferrer"
                          className="text-neon-cyan text-[11px] hover:underline mt-1 inline-block">
                          {c.contestLink}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-col sm:items-end shrink-0">
                    {/* Status change */}
                    <select
                      value={c.status}
                      onChange={e => handleStatusChange(c.id, e.target.value as ContestStatus)}
                      className="bg-midnight border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-neon-cyan/40 cursor-pointer">
                      <option>Upcoming</option>
                      <option>Active</option>
                      <option>Completed</option>
                    </select>
                    <button onClick={() => handleDelete(c.id)}
                      className="flex items-center gap-1 text-text-secondary hover:text-red-400 transition-colors text-xs border border-white/10 hover:border-red-400/30 rounded-lg px-2.5 py-1.5">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-[#0a1628] border border-neon-cyan/20 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-neon-cyan text-base font-bold">Create Contest</h2>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Contest Name *</label>
                <input className="input-field" placeholder="CWCL Week 1 — July 2026" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Week Number</label>
                  <input className="input-field" type="number" min="1" value={form.weekNumber} onChange={e => set('weekNumber', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Mode *</label>
                  <select className="input-field" value={form.mode} onChange={e => set('mode', e.target.value)}>
                    <option>Online</option><option>Offline</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Date *</label>
                  <input className="input-field" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Duration (min)</label>
                  <input className="input-field" type="number" value={form.duration} onChange={e => set('duration', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Start Time *</label>
                  <input className="input-field" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">End Time *</label>
                  <input className="input-field" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
                </div>
              </div>
              {form.mode === 'Online' ? (
                <>
                  <div>
                    <label className="input-label">Platform</label>
                    <input className="input-field" placeholder="Codeforces" value={form.platform} onChange={e => set('platform', e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">Contest Link *</label>
                    <input className="input-field" placeholder="https://codeforces.com/contest/…" value={form.contestLink} onChange={e => set('contestLink', e.target.value)} />
                  </div>
                </>
              ) : (
                <div>
                  <label className="input-label">Venue *</label>
                  <input className="input-field" placeholder="BVRIT Lab Block, Room 204" value={form.venue} onChange={e => set('venue', e.target.value)} />
                </div>
              )}
              <div>
                <label className="input-label">Problem Setter</label>
                <input className="input-field" placeholder="Organiser name" value={form.problemSetter} onChange={e => set('problemSetter', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Instructions</label>
                <textarea className="input-field h-20 resize-none" placeholder="Any special instructions…" value={form.instructions} onChange={e => set('instructions', e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 text-xs disabled:opacity-50">
                  {saving ? 'Creating…' : 'Create Contest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
