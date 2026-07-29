import { useEffect, useState } from 'react';
import type { Announcement, AnnouncementCategory } from '../../types';
import { Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { getAnnouncements } from '../../lib/db';

const CAT_COLOR: Record<AnnouncementCategory, string> = {
  Workshop:    'bg-electric-blue/10 text-electric-blue border-electric-blue/30',
  Hackathon:   'bg-neon-cyan/10     text-neon-cyan     border-neon-cyan/30',
  Contest:     'bg-success/10       text-success       border-success/30',
  Results:     'bg-warning/10       text-warning       border-warning/30',
  Recruitment: 'bg-purple-500/10    text-purple-400    border-purple-500/30',
  Sponsors:    'bg-yellow-500/10    text-yellow-400    border-yellow-500/30',
};

type Row = Announcement & { id: string };

function AnnouncementCard({ a }: { a: Row }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = a.body.length > 200;

  return (
    <div className="card hover:border-neon-cyan/30 transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-heading text-white text-sm font-bold leading-snug">{a.title}</h3>
        <span className={`px-2 py-0.5 rounded-full border text-[10px] shrink-0 ${CAT_COLOR[a.category]}`}>
          {a.category}
        </span>
      </div>

      {/* Body — full text, no truncation, expandable for very long ones */}
      <p className={`text-text-secondary text-xs leading-relaxed whitespace-pre-wrap ${
        isLong && !expanded ? 'line-clamp-4' : ''
      }`}>
        {a.body}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 flex items-center gap-1 text-neon-cyan text-[11px] hover:text-white transition-colors"
        >
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
        </button>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5 text-[10px] text-text-secondary/50">
        <span>Posted by {a.createdBy}</span>
        {(a as any).createdAt?.seconds && (
          <span>·{' '}
            {new Date((a as any).createdAt.seconds * 1000).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Row[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<AnnouncementCategory | 'All'>('All');

  useEffect(() => {
    getAnnouncements(100).then(list => { setAnnouncements(list); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories: AnnouncementCategory[] = ['Workshop', 'Hackathon', 'Contest', 'Results', 'Recruitment', 'Sponsors'];
  const filtered = filter === 'All' ? announcements : announcements.filter(a => a.category === filter);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="heading-md">Announcements</h1>
        <p className="text-text-secondary text-xs mt-1">
          {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} · updates live
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(['All', ...categories] as const).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-body transition-all ${
              filter === cat
                ? 'bg-neon-cyan text-midnight font-bold'
                : 'bg-white/5 text-text-secondary hover:text-white border border-white/10'
            }`}>
            {cat}
            {cat !== 'All' && (
              <span className="ml-1 opacity-60">
                ({announcements.filter(a => a.category === cat).length})
              </span>
            )}
            {cat === 'All' && <span className="ml-1 opacity-60">({announcements.length})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone size={40} className="text-neon-cyan/20 mx-auto mb-3" />
          <h3 className="heading-sm mb-2">No Announcements</h3>
          <p className="text-text-secondary text-sm">
            {filter === 'All' ? 'Nothing posted yet.' : `No ${filter} announcements yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(a => <AnnouncementCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
