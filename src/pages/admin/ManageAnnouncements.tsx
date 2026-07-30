import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement, AnnouncementCategory, AnnouncementAttachment } from '../../types';
import {
  Megaphone, Plus, Trash2, X, Paperclip,
  FileText, Image, File, Loader2, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAnnouncements, insertAnnouncement, deleteAnnouncement } from '../../lib/db';
import { uploadToCloudinary } from '../../lib/cloudinary';

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

function getAttachmentType(file: File): AnnouncementAttachment['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  return 'file';
}

function AttachmentIcon({ type, className = '' }: { type: AnnouncementAttachment['type']; className?: string }) {
  if (type === 'image') return <Image size={14} className={className} />;
  if (type === 'pdf')   return <FileText size={14} className={className} />;
  return <File size={14} className={className} />;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ManageAnnouncements() {
  const { participant } = useAuth();
  const [announcements, setAnnouncements] = useState<(Announcement & { id: string })[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);

  // File attachments
  const [pendingFiles,    setPendingFiles]   = useState<File[]>([]);
  const [uploading,       setUploading]      = useState(false);
  const [uploadProgress,  setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal
  const [previewAnn, setPreviewAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    getAnnouncements(100).then(list => { setAnnouncements(list); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} is too large (max 10MB)`); return false; }
      return true;
    });
    setPendingFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(idx: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleCreate() {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body required'); return; }
    setSaving(true);
    setUploading(pendingFiles.length > 0);

    try {
      // Upload attachments
      const attachments: AnnouncementAttachment[] = [];
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        setUploadProgress(Math.round((i / pendingFiles.length) * 100));
        const result = await uploadToCloudinary(file, `announcement_${Date.now()}_${i}`);
        attachments.push({
          url: result.secure_url,
          name: file.name,
          type: getAttachmentType(file),
          size: file.size,
        });
      }
      setUploadProgress(100);
      setUploading(false);

      const id = await insertAnnouncement({
        title: form.title, body: form.body, category: form.category,
        createdBy: participant?.participantId ?? 'admin',
        createdAt: new Date().toISOString(),
        attachments,
      });
      setAnnouncements(prev => [{
        id, ...form,
        createdBy: participant?.participantId ?? 'admin',
        createdAt: new Date().toISOString(),
        attachments,
      }, ...prev]);
      toast.success('Announcement posted!');
      setForm(EMPTY);
      setPendingFiles([]);
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
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

      {/* ── Create Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-[#0a1628] border border-neon-cyan/20 rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-neon-cyan text-base font-bold">New Announcement</h2>
              <button onClick={() => { setShowForm(false); setPendingFiles([]); }}
                className="text-text-secondary hover:text-white p-1">
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

              {/* ── File Attachments ── */}
              <div>
                <label className="input-label">Attachments (optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files).filter(f => f.size <= 10 * 1024 * 1024);
                    setPendingFiles(prev => [...prev, ...files]);
                  }}
                  className="border-2 border-dashed border-white/15 hover:border-neon-cyan/40 rounded-lg p-4 text-center cursor-pointer transition-colors group"
                >
                  <Paperclip size={20} className="mx-auto text-text-secondary/40 group-hover:text-neon-cyan/60 mb-2 transition-colors" />
                  <p className="text-xs text-text-secondary/60">Click or drag files here</p>
                  <p className="text-[10px] text-text-secondary/40 mt-0.5">Images (PNG, JPG) · PDF · Max 10MB each</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* File list */}
                {pendingFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {pendingFiles.map((file, idx) => {
                      const type = getAttachmentType(file);
                      return (
                        <div key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                          <AttachmentIcon type={type}
                            className={type === 'image' ? 'text-neon-cyan' : type === 'pdf' ? 'text-red-400' : 'text-text-secondary'} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white truncate">{file.name}</div>
                            <div className="text-[10px] text-text-secondary/50">{formatBytes(file.size)}</div>
                          </div>
                          <button onClick={() => removeFile(idx)}
                            className="text-text-secondary/50 hover:text-red-400 transition-colors p-0.5">
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-1 bg-neon-cyan/5 border border-neon-cyan/20 p-3 rounded-lg">
                  <div className="flex justify-between text-[11px] text-neon-cyan font-bold">
                    <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Uploading files…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-neon-cyan h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); setPendingFiles([]); }}
                  className="btn-secondary flex-1 text-xs">Cancel</button>
                <button onClick={handleCreate} disabled={saving}
                  className="btn-primary flex-1 text-xs disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {saving ? <><Loader2 size={12} className="animate-spin" /> Posting…</> : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewAnn && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewAnn(null)}>
          <div className="bg-[#0a1628] border border-neon-cyan/20 rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-heading text-white text-sm font-bold">{previewAnn.title}</h3>
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full border text-[10px] ${CAT_COLOR[previewAnn.category]}`}>
                  {previewAnn.category}
                </span>
              </div>
              <button onClick={() => setPreviewAnn(null)} className="text-text-secondary hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap mb-4">{previewAnn.body}</p>
            {previewAnn.attachments && previewAnn.attachments.length > 0 && (
              <AttachmentDisplay attachments={previewAnn.attachments} />
            )}
          </div>
        </div>
      )}

      {/* ── List ── */}
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-heading text-white text-sm font-bold">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${CAT_COLOR[a.category]}`}>
                      {a.category}
                    </span>
                    {a.attachments && a.attachments.length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-text-secondary">
                        <Paperclip size={9} /> {a.attachments.length}
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">{a.body}</p>
                  <p className="text-text-secondary/40 text-[10px] mt-2">By {a.createdBy}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setPreviewAnn(a)}
                    className="text-text-secondary hover:text-neon-cyan transition-colors p-1" title="Preview">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)}
                    className="text-text-secondary hover:text-red-400 transition-colors p-1" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared Attachment Display Component ── */
export function AttachmentDisplay({ attachments }: { attachments: AnnouncementAttachment[] }) {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(a => a.type === 'image');
  const others = attachments.filter(a => a.type !== 'image');

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
      <div className="text-[10px] text-text-secondary/50 uppercase tracking-wider flex items-center gap-1.5">
        <Paperclip size={10} /> {attachments.length} Attachment{attachments.length !== 1 ? 's' : ''}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((att, idx) => (
            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-white/10 hover:border-neon-cyan/30 transition-colors group">
              <img src={att.url} alt={att.name}
                className="w-full object-cover max-h-48 group-hover:scale-[1.02] transition-transform duration-200" />
              <div className="px-2 py-1.5 bg-midnight/80 text-[10px] text-text-secondary/60 truncate">
                {att.name}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* PDF / file list */}
      {others.length > 0 && (
        <div className="space-y-1.5">
          {others.map((att, idx) => (
            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                att.type === 'pdf' ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/10 border border-white/10'
              }`}>
                {att.type === 'pdf'
                  ? <FileText size={14} className="text-red-400" />
                  : <File size={14} className="text-text-secondary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white font-medium truncate group-hover:text-neon-cyan transition-colors">
                  {att.name}
                </div>
                {att.size && (
                  <div className="text-[10px] text-text-secondary/50">{formatBytes(att.size)}</div>
                )}
              </div>
              <div className="text-[10px] text-neon-cyan/60 group-hover:text-neon-cyan transition-colors shrink-0">
                Open ↗
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
