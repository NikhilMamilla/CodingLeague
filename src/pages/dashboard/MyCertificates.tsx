import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Download, CheckCircle2, Clock, Share2, ShieldCheck, Crown } from 'lucide-react';
import type { Certificate } from '../../types';
import toast from 'react-hot-toast';
import { downloadCertificate, downloadFoundingCertificate } from '../../lib/certificateGenerator';
import FoundingMemberBadge from '../../components/ui/FoundingMemberBadge';

const TYPE_EMOJI: Record<string, string> = {
  Winner: '🏆',
  Participation: '📜',
  'Monthly Champion': '👑',
};

export default function MyCertificates() {
  const { participant } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participant) return;

    // Real-time listener for student certificates
    const q1 = query(
      collection(db, 'certificates'),
      where('participantId', '==', participant.participantId),
      orderBy('createdAt', 'desc')
    );

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certificate));
        setCerts(list);
        setLoading(false);
      },
      async () => {
        const q2 = query(
          collection(db, 'certificates'),
          where('email', '==', participant.email)
        );
        onSnapshot(q2, (snap2) => {
          setCerts(snap2.docs.map((d) => ({ id: d.id, ...d.data() } as Certificate)));
          setLoading(false);
        });
      }
    );

    return () => unsub1();
  }, [participant]);

  if (!participant) return null;

  function share(cert: Certificate) {
    const certId = cert.certificateId || cert.verificationCode || cert.id;
    const url = `${window.location.origin}/verify/${certId}`;
    const text = `I earned a ${cert.certificateType || 'certificate'} at CWCL! Verify here: ${url}`;

    if (navigator.share) {
      navigator.share({ title: 'CWCL Certificate', text, url });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Certificate link copied to clipboard!');
    }
  }

  async function handleDownload(cert: Certificate) {
    try {
      toast.loading('Generating certificate download…', { id: 'cert-dl' });
      await downloadCertificate({
        certificateId: cert.certificateId || cert.id,
        participantName: cert.participantName || participant?.fullName || 'Participant',
        certificateType: cert.certificateType || cert.type || 'Participation',
        position: cert.position,
        issuedDate: cert.issuedDate,
      });
      toast.success('Download started!', { id: 'cert-dl' });
    } catch {
      toast.error('Failed to download certificate', { id: 'cert-dl' });
    }
  }

  const issuedCount = certs.filter((c) => (c.status || 'Issued') === 'Issued').length;
  const pendingCount = certs.filter((c) => c.status === 'Pending').length;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="heading-md flex items-center gap-2">
          <Award className="text-neon-cyan" size={24} />
          My Certificates
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          View your official certificates issued directly by CWCL Administration.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <Award size={48} className="text-neon-cyan/20 mx-auto" />
          <h3 className="heading-sm text-sm">No Certificates Issued Yet</h3>
          <p className="text-text-secondary text-xs max-w-md mx-auto leading-relaxed">
            Certificates are issued by the Admin after contest evaluations. Compete in weekly league matches to earn certificates!
          </p>
        </div>
      ) : (
        <>
          {/* Founding Member Downloads */}
          {participant.foundingMember && (
            <div className="card border-gold/30 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gold/10">
                <Crown size={14} className="text-gold" />
                <h2 className="font-heading text-sm font-bold text-gold">Founding Member Downloads</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <FoundingMemberBadge size={140} />
                  <FoundingMemberBadge size={160} downloadable />
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-3 p-4 rounded-xl bg-gold/5 border border-gold/10">
                  <div className="text-3xl">📜</div>
                  <div>
                    <h3 className="font-heading text-white text-xs font-bold uppercase tracking-wide">Founding Certificate</h3>
                    <p className="text-text-secondary/60 text-[10px] mt-1">
                      Official certificate recognizing your inaugural membership.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      toast.loading('Generating certificate…', { id: 'fm-cert' });
                      downloadFoundingCertificate({
                        certificateId: `CWCL-FM-${participant.participantId}`,
                        participantName: participant.fullName,
                        season: participant.foundingSeasonId || '2026–27',
                        issuedDate: participant.foundingAwardedAt
                          ? new Date(participant.foundingAwardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                          : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                      }).then(() => toast.success('Certificate downloaded!', { id: 'fm-cert' }))
                        .catch(() => toast.error('Download failed', { id: 'fm-cert' }));
                    }}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
                  >
                    <Download size={13} /> Download Certificate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="card p-4 space-y-1">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Total Earned</div>
              <div className="stat-number text-2xl text-neon-cyan">{certs.length}</div>
            </div>
            <div className="card p-4 space-y-1">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Issued</div>
              <div className="stat-number text-2xl text-success">{issuedCount}</div>
            </div>
            <div className="card p-4 space-y-1">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider">Pending Approval</div>
              <div className="stat-number text-2xl text-gold">{pendingCount}</div>
            </div>
          </div>

          {/* Certificate Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {certs.map((c) => {
              const isIssued = (c.status || 'Issued') === 'Issued';
              const certType = c.certificateType || c.type || 'Participation';
              const emoji = TYPE_EMOJI[certType] || '📜';
              const certId = c.certificateId || c.verificationCode || c.id;

              return (
                <div
                  key={c.id}
                  className="card p-5 space-y-4 border border-white/10 hover:border-neon-cyan/30 transition-all bg-card-dark"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-2xl shrink-0">
                        {emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-sm font-bold text-white">
                            {certType} Certificate
                          </h3>
                          {isIssued ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-success font-semibold bg-success/10 px-2 py-0.5 rounded border border-success/20">
                              <CheckCircle2 size={10} /> Issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gold font-semibold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                              <Clock size={10} /> Pending Approval
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {c.contestName || 'CBB Weekly Coding League'}
                          {c.position && <span className="text-gold font-bold ml-1">({c.position})</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-text-secondary pt-2 border-t border-white/5">
                    <div className="flex justify-between">
                      <span>Certificate ID:</span>
                      <span className="font-mono text-neon-cyan font-semibold">{certId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <span className="text-white/80">{c.issuedDate || '—'}</span>
                    </div>
                    {c.season && (
                      <div className="flex justify-between">
                        <span>Season:</span>
                        <span className="text-white/80">{c.season}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {isIssued ? (
                      <button
                        onClick={() => handleDownload(c)}
                        className="btn-primary text-xs py-2 flex-1 flex items-center justify-center gap-1.5"
                      >
                        <Download size={13} /> Download Certificate
                      </button>
                    ) : (
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 text-center text-xs text-text-secondary/60 italic">
                        Download unavailable (Pending Approval)
                      </div>
                    )}

                    <a
                      href={`/verify/${certId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                      title="Verify Online"
                    >
                      <ShieldCheck size={13} /> Verify
                    </a>

                    {isIssued && (
                      <button
                        onClick={() => share(c)}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                        title="Share Certificate"
                      >
                        <Share2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
