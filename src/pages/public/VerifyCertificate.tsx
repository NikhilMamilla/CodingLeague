import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Certificate } from '../../types';
import { getCertificateByCode } from '../../lib/db';
import {
  ShieldCheck, AlertCircle, Search, Download,
  CheckCircle2, ArrowLeft
} from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';
import { renderCertificate, downloadCertificate } from '../../lib/certificateGenerator';

export default function VerifyCertificate() {
  const { certificateId: paramCertId } = useParams<{ certificateId?: string }>();
  const [inputCertId, setInputCertId] = useState(paramCertId || '');
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function performVerification(idToSearch: string) {
    if (!idToSearch.trim()) return;
    setLoading(true);
    setSearched(true);
    setCert(null);

    try {
      const cleanId = idToSearch.trim();
      const cert = await getCertificateByCode(cleanId);
      if (cert) setCert(cert);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (paramCertId) {
      setInputCertId(paramCertId);
      performVerification(paramCertId);
    }
  }, [paramCertId]);

  // Render canvas when cert is found
  useEffect(() => {
    if (cert && canvasRef.current) {
      renderCertificate(canvasRef.current, {
        certificateId: cert.certificateId || cert.id,
        participantName: cert.participantName,
        certificateType: cert.certificateType || cert.type || 'Participation',
        position: cert.position,
        issuedDate: cert.issuedDate,
      });
    }
  }, [cert]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    performVerification(inputCertId);
  }

  return (
    <div className="min-h-screen bg-midnight bg-grid text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl space-y-6">

        {/* Back Link & Logo */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-text-secondary/60 hover:text-neon-cyan text-xs font-body transition-colors"
          >
            <ArrowLeft size={13} /> Back to CWCL Home
          </Link>
          <div className="flex items-center gap-2">
            <CBBLogo size={24} glow={false} />
            <span className="font-heading text-xs text-neon-cyan tracking-widest">CWCL VERIFY</span>
          </div>
        </div>

        {/* Search Header */}
        <div className="text-center space-y-2">
          <h1 className="heading-md flex items-center justify-center gap-2 text-2xl">
            <ShieldCheck className="text-neon-cyan" size={28} />
            Official Certificate Verification
          </h1>
          <p className="text-text-secondary text-xs max-w-md mx-auto">
            Verify the authenticity of CBB Weekly Coding League certificates issued by the administration.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="card-glow p-4 space-y-3">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                className="input-field pl-10 text-sm font-mono tracking-wider"
                placeholder="Enter Certificate ID (e.g. CWCL-AUG26-0001)"
                value={inputCertId}
                onChange={(e) => setInputCertId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCertId.trim()}
              className="btn-primary text-xs px-5 py-3 shrink-0 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify Certificate'}
            </button>
          </div>
        </form>

        {/* Verification Loading State */}
        {loading && (
          <div className="card text-center py-12 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin mx-auto" />
            <p className="text-xs text-text-secondary">Checking official certificate registry…</p>
          </div>
        )}

        {/* Verification Result: VERIFIED */}
        {!loading && searched && cert && (
          <div className="card-glow border-success/40 bg-success/5 p-6 space-y-6">

            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-success/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/20 border border-success/40 flex items-center justify-center text-success shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-base font-bold text-white">Certificate Verified</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/20 text-success border border-success/30">
                      OFFICIAL & VALID
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary/80">
                    This certificate is authentic and registered in the CWCL database.
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-midnight/60 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Certificate ID</span>
                <p className="font-mono text-sm text-neon-cyan font-bold">
                  {cert.certificateId || cert.verificationCode || cert.id}
                </p>
              </div>

              <div className="space-y-1 bg-midnight/60 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Certificate Holder</span>
                <p className="text-sm text-white font-bold">{cert.participantName}</p>
                {cert.email && <p className="text-[10px] text-text-secondary">{cert.email}</p>}
              </div>

              <div className="space-y-1 bg-midnight/60 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Certificate Type</span>
                <p className="text-sm text-gold font-bold">{cert.certificateType || cert.type}</p>
              </div>

              <div className="space-y-1 bg-midnight/60 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Contest / Event</span>
                <p className="text-sm text-white font-semibold">
                  {cert.contestName || 'CBB Weekly Coding League'}
                  {cert.position && <span className="text-gold ml-1">({cert.position})</span>}
                </p>
              </div>

              <div className="space-y-1 bg-midnight/60 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Issued Date</span>
                <p className="text-xs text-white/90">{cert.issuedDate || '—'}</p>
              </div>

              <div className="space-y-1 bg-midnight/60 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Issued By</span>
                <p className="text-xs text-white/90">{cert.issuedBy || 'CWCL Administration'}</p>
              </div>
            </div>

            {/* Rendered Certificate Preview */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold">
                Official Document Preview
              </div>
              <div className="border border-white/10 rounded-lg overflow-hidden bg-black flex justify-center p-2">
                <canvas ref={canvasRef} className="w-full h-auto rounded shadow-lg" />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    downloadCertificate({
                      certificateId: cert.certificateId || cert.id,
                      participantName: cert.participantName,
                      certificateType: cert.certificateType || cert.type || 'Participation',
                      position: cert.position,
                      issuedDate: cert.issuedDate,
                    })
                  }
                  className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
                >
                  <Download size={14} /> Download Official Certificate Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Result: NOT FOUND */}
        {!loading && searched && !cert && (
          <div className="card border-red-500/40 bg-red-500/5 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="heading-sm text-base text-red-400">Certificate Not Found</h2>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                The Certificate ID <code className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono">{inputCertId}</code> was not found in the official CWCL certificate registry. Please verify the ID and try again.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
