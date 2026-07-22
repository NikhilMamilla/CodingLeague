import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement, AnnouncementCategory } from '../../types';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES: AnnouncementCategory[] = [
  'Workshop', 'Hackathon', 'Contest', 'Results', 'Recruitment', 'Sponsors',
];

const CAT_COLOR: Record<AnnouncementCategory, string> = {
  Workshop:    'bg-electric-blue/10 text-electric-blue border-electric-blue/30',
  Hackathon:   'bg-neon-cyan/10     text-neon-cyan     border-neon-cyan/30',
  Contest:     'bg-success/10       text-success       border-success/30',
  Results:     'bg-warning/10       text-warning       border-warning/30',
  Recruitment: 'bg-purple-500/10    text-purple-400    border-purple-500/30',
  Sponsors:    'bg-yellow-500/10    text-yellow-400    border-yellow-500/30',
};

const EMPTY = { title: '', body: '', category: 'Contest' as AnnouncementCategory };

export default function ManageAnnouncements() {
  const { participant } = useAuth();
  const [announcements, setAnnouncements] = useState<(Announcement & { id: string })[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement & { id: string })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleCreate() {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body required'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title:     form.title,
        body:      form.body,
        category:  form.category,
        createdBy: participant?.participantId ?? 'admin',
        createdAt: serverTimestamp(),
      });
      toast.success('Announcement posted!');
      setForm(EMPTY);
      setShowForm(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.success('Deleted');
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md">Announcements</h1>
          <p className="text-text-secondary text-xs mt-1">{announcements.length} posted · updates live</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2">
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-[#0a1628] border border-neon-cyan/20 rounded-xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-neon-cyan text-base font-bold">New Announcement</h2>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Title *</label>
                <input className="input-field" placeholder="Announcement title"
                  value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Category</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Message *</label>
                <textarea className="input-field h-32 resize-none" placeholder="Write your announcement…"
                  value={form.body} onChange={e => set('body', e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
                <button onClick={handleCreate} disabled={saving}
                  className="btn-primary flex-1 text-xs disabled:opacity-50">
                  {saving ? 'Posting…' : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone size={40} className="text-neon-cyan/20 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No announcements yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {announcements.map(a => (
            <div key={a.id} className="card hover:border-neon-cyan/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-heading text-white text-sm font-bold">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${CAT_COLOR[a.category]}`}>
                      {a.category}
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs leading-relaxed">{a.body}</p>
                  <p className="text-text-secondary/40 text-[10px] mt-2">By {a.createdBy}</p>
                </div>
                <button onClick={() => handleDelete(a.id)}
                  className="text-text-secondary hover:text-red-400 transition-colors shrink-0 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
