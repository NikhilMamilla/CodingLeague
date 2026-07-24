import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Participant } from '../../types';
import CBBLogo from '../../components/ui/CBBLogo';

const PAGE_SIZE = 12;

export default function FoundingMembers() {
  const [members, setMembers] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = query(
      collection(db, 'participants'),
      where('foundingMember', '==', true),
      orderBy('foundingRank', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Participant)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return members;
    return members.filter(p =>
      p.fullName.toLowerCase().includes(s) ||
      p.college.toLowerCase().includes(s) ||
      p.participantId.toLowerCase().includes(s)
    );
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageMembers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown size={28} className="text-gold" />
            <CBBLogo size={56} glow={false} />
            <Crown size={28} className="text-gold" />
          </div>
          <h1 className="heading-lg mb-3">Founding Members</h1>
          <p className="text-text-secondary text-sm max-w-xl mx-auto leading-relaxed">
            The first {members.length} registered participants of CWCL {members[0]?.foundingSeasonId || '2026–27'}.
            Founding Members receive lifetime recognition, an exclusive badge, and a dedicated certificate.
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              className="input-field pl-9"
              placeholder="Search by name, college, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-text-secondary text-xs">
            Showing <span className="text-gold font-numbers font-bold">{filtered.length}</span> founding member{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Crown size={48} className="text-gold/20 mx-auto mb-4" />
            <h2 className="heading-sm text-sm mb-2">No Founding Members Yet</h2>
            <p className="text-text-secondary text-xs">Founding member slots will appear here once registration begins.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {pageMembers.map(p => (
                <div
                  key={p.uid}
                  className="card border-gold/20 hover:border-gold/40 transition-all text-center group"
                >
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 rounded-full founding-avatar overflow-hidden flex items-center justify-center bg-midnight mx-auto">
                      {p.photoURL ? (
                        <img src={p.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-heading text-2xl font-bold text-gold">
                          {p.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold text-midnight flex items-center justify-center font-heading text-[10px] font-bold border-2 border-midnight">
                      #{p.foundingRank}
                    </div>
                  </div>

                  <h3 className="font-heading text-white text-xs font-bold uppercase tracking-wide truncate">
                    {p.fullName}
                  </h3>
                  <p className="text-text-secondary/60 text-[10px] mt-1 truncate">{p.college}</p>

                  <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-text-secondary/60 space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono text-gold font-semibold">{p.participantId}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Calendar size={10} />
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>

                  <Link
                    to={`/profile/${p.participantId}`}
                    className="mt-4 block w-full py-2 rounded-lg border border-gold/20 text-gold text-[10px] font-heading font-bold uppercase tracking-wider hover:bg-gold/10 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-white/10 text-text-secondary hover:text-white hover:border-neon-cyan/30 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-text-secondary">
                  Page <span className="text-gold font-numbers font-bold">{page}</span> / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-text-secondary hover:text-white hover:border-neon-cyan/30 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
