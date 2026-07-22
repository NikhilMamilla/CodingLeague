import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Contest, ContestMode } from '../../types';
import { Plus, Trash2, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '', weekNumber: '', mode: 'Online' as ContestMode,
  date: '', startTime: '', endTime: '', duration: '120',
  platform: 'Codeforces', contestLink: '', venue: '',
  problemSetter: '', instructions: '',
};

export default function ManageContests() {
  const [contests, setContests]   = useState<Contest[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form,     setForm]       = useState(EMPTY);
  const [saving,   setSaving]     = useState(false);

  async function load() {
    try {
      const q = query(collection(db, 'contests'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setContests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contest)));
    } catch { /**/ } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleCreate() {
    if (!form.name || !form.date || !form.startTime || !form.endTime) {
      toast.error('Please fill in all required fields'); return;
    }
    if (form.mode === 'Online' && !form.contestLink) { toast.error('Contest link is required for online contests'); return; }
    if (form.mode === 'Offline' && !form.venue)      { toast.error('Venue is required for offline contests'); return; }
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
        status:        'Upcoming',
        seasonId:      'cwcl-2026-27',
        createdAt:     serverTimestamp(),
      });
      toast.success('Contest created!');
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contest? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'contests', id));
      toast.success('Contest deleted');
      setContests(c => c.filter(x => x.id !== id));
    } catch (e: any) { toast.error(e.message); }
  }

  const STATUS_COLOR: Record<string, string> = {
    Upcoming:  'bg-warning/10  text-warning  border-warning/30',
    Active:    'bg-success/10  text-success  border-success/30',
    Completed: 'bg-white/5     text-text-secondary border-white/10',
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md mb-1">Contests</h1>
          <p className="text-text-secondary text-xs">Manage weekly contest schedule.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs flex items-center gap-2 px-4">
          <Plus size={14} /> New Contest
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card-dark border border-neon-cyan/20 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="heading-sm">Create Contest</h2>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Contest Name *</label>
                <input className="input-field" placeholder="CWCL Week 1" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Week Number</label>
                  <input className="input-field" type="number" value={form.weekNumber} onChange={e => set('weekNumber', e.target.value)} />
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
                <input className="input-field" value={form.problemSetter} onChange={e => set('problemSetter', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Instructions</label>
                <textarea className="input-field h-20 resize-none" value={form.instructions} onChange={e => set('instructions', e.target.value)} />
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

      {/* Contest List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : contests.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={40} className="text-neon-cyan/20 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No contests yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contests.map(c => (
            <div key={c.id} className="card flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading text-white text-sm">{c.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-numbers ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-text-secondary text-[10px]">
                  {c.date} · {c.startTime}–{c.endTime} · {c.mode}
                  {c.mode === 'Online' ? ` · ${c.platform}` : ` · ${c.venue}`}
                </p>
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-text-secondary hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
