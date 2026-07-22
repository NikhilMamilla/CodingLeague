import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Download, CheckCircle } from 'lucide-react';
import type { Certificate } from '../../types';

const CERT_META: Record<string, { emoji: string; label: string; color: string }> = {
  participation:     { emoji: '📜', label: 'Participation',     color: 'text-electric-blue' },
  winner:            { emoji: '🏆', label: 'Winner',            color: 'text-gold'          },
  monthly_champion:  { emoji: '👑', label: 'Monthly Champion',  color: 'text-neon-cyan'     },
  annual_champion:   { emoji: '🌟', label: 'Annual Champion',   color: 'text-gold'          },
};

export default function MyCertificates() {
  const { participant } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participant) return;
    async function load() {
      try {
        const q = query(
          collection(db, 'certificates'),
          where('participantId', '==', participant!.participantId),
          orderBy('issuedAt', 'desc')
        );
        const snap = await getDocs(q);
        setCerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate)));
      } catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, [participant]);

  if (!participant) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="heading-md mb-1">My Certificates</h1>
        <p className="text-text-secondary text-xs">Download your achievement certificates.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <div className="card text-center py-12">
          <Award size={40} className="text-neon-cyan/20 mx-auto mb-3" />
          <h3 className="heading-sm mb-2">No Certificates Yet</h3>
          <p className="text-text-secondary text-sm">Certificates will appear here after you participate in contests and achieve milestones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map(c => {
            const meta = CERT_META[c.type] ?? { emoji: '📜', label: 'Certificate', color: 'text-white' };
            return (
              <div key={c.id} className="card hover:border-neon-cyan/40 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-2xl shrink-0">
                    {meta.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-heading text-sm font-bold ${meta.color}`}>{meta.label}</h3>
                      <CheckCircle size={12} className="text-success" />
                    </div>
                    <div className="text-text-secondary text-[10px] mt-0.5">
                      {c.contestId && `Contest: ${c.contestId}`}
                      {c.month && `Month: ${c.month}`}
                      {c.seasonId && `Season: ${c.seasonId}`}
                    </div>
                    <div className="text-text-secondary/60 text-[10px] mt-0.5">
                      Issued: {new Date(c.issuedAt).toLocaleDateString()}
                    </div>
                    <div className="text-text-secondary/50 text-[9px] font-numbers mt-1">
                      Verification: {c.verificationCode}
                    </div>
                  </div>
                </div>
                <a href={c.pdfURL} target="_blank" rel="noopener noreferrer" download
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shrink-0">
                  <Download size={12} /> Download
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
