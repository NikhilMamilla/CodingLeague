import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Download, CheckCircle, Share2, Copy } from 'lucide-react';
import type { Certificate } from '../../types';
import toast from 'react-hot-toast';

const CERT_META: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  participation:    { emoji: '📜', label: 'Participation',    color: 'text-electric-blue', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)'  },
  winner:           { emoji: '🏆', label: 'Winner',           color: 'text-gold',          bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.25)'   },
  monthly_champion: { emoji: '👑', label: 'Monthly Champion', color: 'text-neon-cyan',     bg: 'rgba(0,229,255,0.08)',   border: 'rgba(0,229,255,0.25)'   },
  annual_champion:  { emoji: '🌟', label: 'Annual Champion',  color: 'text-gold',          bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.35)'   },
};

const STATS = [
  { key: 'participation',    label: 'Participations' },
  { key: 'winner',           label: 'Winner'         },
  { key: 'monthly_champion', label: 'Monthly Champ'  },
  { key: 'annual_champion',  label: 'Annual Champ'   },
];

export default function MyCertificates() {
  const { participant } = useAuth();
  const [certs,   setCerts]   = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>('all');

  useEffect(() => {
    if (!participant) return;

    // Real-time listener for certificates
    const q = query(
      collection(db, 'certificates'),
      where('participantId', '==', participant.participantId),
      orderBy('issuedAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate)));
        setLoading(false);
      },
      () => { setLoading(false); }
    );
    return () => unsub();
  }, [participant]);

  if (!participant) return null;

  const filtered = filter === 'all' ? certs : certs.filter(c => c.type === filter);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('Verification code copied!');
  }

  function share(cert: Certificate) {
    const text = `I earned a ${CERT_META[cert.type]?.label ?? 'certificate'} at CWCL! Verify: ${cert.verificationCode}`;
    if (navigator.share) {
      navigator.share({ title: 'My CWCL Certificate', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Share text copied!');
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="heading-md">My Certificates</h1>
        <p className="text-text-secondary text-xs mt-1">Download and share your achievement certificates.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(s => {
              const count = certs.filter(c => c.type === s.key).length;
              const meta  = CERT_META[s.key];
              return (
                <button key={s.key}
                  onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
                  className={`card text-center py-5 cursor-pointer transition-all ${
                    filter === s.key ? 'border-neon-cyan/60 !bg-neon-cyan/5' : ''
                  }`}>
                  <div className="text-3xl mb-2">{meta.emoji}</div>
                  <div className={`stat-number text-2xl ${meta.color}`}>{count}</div>
                  <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1">{s.label}</div>
                </button>
              );
            })}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {['all', ...STATS.map(s => s.key)].map(f => (
              <button key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-body transition-all ${
                  filter === f
                    ? 'bg-neon-cyan text-midnight font-bold'
                    : 'bg-white/5 text-text-secondary hover:text-white border border-white/10'
                }`}>
                {f === 'all' ? `All (${certs.length})` : `${CERT_META[f]?.label} (${certs.filter(c => c.type === f).length})`}
              </button>
            ))}
          </div>

          {/* Certificate list */}
          {filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Award size={48} className="text-neon-cyan/20 mx-auto mb-4" />
              <h3 className="heading-sm mb-2">
                {filter === 'all' ? 'No Certificates Yet' : 'No Certificates in This Category'}
              </h3>
              <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
                {filter === 'all'
                  ? 'Certificates will appear here after you participate in contests and hit milestones.'
                  : 'Keep competing — this one will come!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map(c => {
                const meta = CERT_META[c.type] ?? CERT_META.participation;
                return (
                  <div key={c.id}
                    className="rounded-xl border p-5 transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]"
                    style={{ background: meta.bg, borderColor: meta.border }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                          {meta.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-heading text-sm font-bold ${meta.color}`}>{meta.label}</h3>
                            <CheckCircle size={12} className="text-success" />
                          </div>
                          <div className="text-text-secondary text-[10px] mt-0.5 space-y-0.5">
                            {c.contestId && <div>Contest: <span className="text-white/70">{c.contestId}</span></div>}
                            {c.month     && <div>Month: <span className="text-white/70">{c.month}</span></div>}
                            {c.seasonId  && <div>Season: <span className="text-white/70">{c.seasonId}</span></div>}
                            <div>Issued: <span className="text-white/70">{new Date(c.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verification code */}
                    <div className="mt-4 flex items-center gap-2 bg-midnight/50 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Verify:</span>
                      <code className="text-[11px] text-neon-cyan font-numbers flex-1 truncate">{c.verificationCode}</code>
                      <button onClick={() => copyCode(c.verificationCode)}
                        className="text-text-secondary hover:text-neon-cyan transition-colors shrink-0">
                        <Copy size={12} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <a href={c.pdfURL} target="_blank" rel="noopener noreferrer"
                        className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5">
                        <Download size={12} /> Download PDF
                      </a>
                      <button onClick={() => share(c)}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
                        <Share2 size={12} /> Share
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
