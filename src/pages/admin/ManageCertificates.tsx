import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Certificate, Participant, CertificateType, Contest } from '../../types';
import {
  Award, Plus, Search, Filter, Trash2, Eye, Download, Mail,
  CheckCircle2, Clock, AlertTriangle, X, Loader2, Sparkles, Crown, Zap, Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { renderCertificate, downloadCertificate, type CertificateData } from '../../lib/certificateGenerator';
import { getCertificates, getParticipants, upsertCertificate, deleteCertificate, getContests, getResultsByContest } from '../../lib/db';

const CERT_TYPES: CertificateType[] = [
  'Participation',
  'Winner',
  'Monthly Champion',
  'Founding Member',
];

export default function ManageCertificates() {
  const { user, participant: currentAdmin } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Active state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertificateData | null>(null);
  const [deleteCertTarget, setDeleteCertTarget] = useState<Certificate | null>(null);
  const [emailCertTarget, setEmailCertTarget] = useState<Certificate | null>(null);

  // Form State for Certificate Generation
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [certType, setCertType] = useState<CertificateType>('Participation');
  const [contestName] = useState('CBB WEEKLY CODING LEAGUE');
  const [season] = useState('2026-27');
  const [position, setPosition] = useState('1st');
  const [issuedDateStr, setIssuedDateStr] = useState('29th August 2026');
  // Per-uid position overrides for winner bulk issuance (rank → "1st", "2nd", etc.)
  const [winnerPositions, setWinnerPositions] = useState<Record<string, string>>({});
  
  // Participant selector search & filters
  const [participantSearch, setParticipantSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Bulk Generation Progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Contest-based bulk selection
  const [contests, setContests] = useState<Contest[]>([]);
  const [contestPickerOpen, setContestPickerOpen] = useState(false);
  const [winnerPickerOpen, setWinnerPickerOpen] = useState(false);
  const [loadingContestParticipants, setLoadingContestParticipants] = useState(false);

  // Canvas refs for preview
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const inlineCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    getCertificates().then(list => { setCerts(list); setLoading(false); }).catch(() => setLoading(false));
    // getParticipants() (not getBasicParticipants()) — this admin page needs
    // email to send certificates, which the public column set excludes.
    getParticipants().then(list => setParticipants(list)).catch(() => {});
    getContests().then(list => setContests(list.filter(c => c.status === 'Completed'))).catch(() => {});
  }, []);

  // Render canvas preview whenever previewCert state changes
  useEffect(() => {
    if (previewCert && modalCanvasRef.current) {
      renderCertificate(modalCanvasRef.current, previewCert);
    }
  }, [previewCert]);

  // Render inline form preview
  useEffect(() => {
    if (showCreateModal && inlineCanvasRef.current && selectedUids.length > 0) {
      const samplePart = participants.find((p) => p.uid === selectedUids[0]);
      renderCertificate(inlineCanvasRef.current, {
        certificateId: 'CWCL-PREVIEW-000',
        participantName: samplePart?.fullName || 'Participant Name',
        certificateType: certType,
        contestName,
        season,
        position,
        issuedDate: issuedDateStr,
      });
    }
  }, [showCreateModal, selectedUids, certType, contestName, season, position, issuedDateStr, participants]);

  // Statistics calculation
  const totalCerts = certs.length;
  const issuedCerts = certs.filter((c) => c.status === 'Issued').length;
  const pendingCerts = certs.filter((c) => c.status === 'Pending').length;
  const thisMonthCerts = certs.filter((c) => {
    const d = new Date(c.issuedDate || c.createdAt || '');
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Filtered Certificates
  const filteredCerts = certs.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      c.certificateId?.toLowerCase().includes(q) ||
      c.participantName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.contestName?.toLowerCase().includes(q) ||
      c.certificateType?.toLowerCase().includes(q);

    const matchType = typeFilter === 'all' || c.certificateType === typeFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  // Helper to generate unique Certificate ID
  function generateCertId(indexOffset = 0): string {
    const prefix = 'CWCL';
    const month = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const yr = new Date().getFullYear().toString().slice(-2);
    const num = String(certs.length + 1 + indexOffset).padStart(4, '0');
    return `${prefix}-${month}${yr}-${num}`;
  }

  // Issue Certificates to Participants
  async function handleGenerateAndIssue() {
    if (selectedUids.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: selectedUids.length });

    let successCount = 0;
    try {
      for (let i = 0; i < selectedUids.length; i++) {
        const uid = selectedUids[i];
        const part = participants.find((p) => p.uid === uid);
        if (!part) continue;

        const certId = generateCertId(i);
        const newId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}`;
        // Use per-uid position for winners (set during bulk winner selection), else global position
        const certPosition = certType === 'Winner'
          ? (winnerPositions[uid] || position)
          : undefined;
        await upsertCertificate({
          id: newId,
          certificateId: certId,
          participantId: part.participantId || part.uid,
          participantName: part.fullName,
          email: part.email,
          certificateType: certType,
          contestName,
          season,
          position: certPosition,
          issuedDate: issuedDateStr,
          status: 'Issued',
          issuedBy: currentAdmin?.fullName || user?.email || 'Admin',
          templateId: certType.toLowerCase().replace(/\s+/g, '_'),
          createdAt: new Date().toISOString(),
        });
        setCerts(prev => [...prev, { id: newId, certificateId: certId, participantId: part.participantId || part.uid, participantName: part.fullName, email: part.email, certificateType: certType, contestName, season, position: certPosition, issuedDate: issuedDateStr, status: 'Issued', issuedBy: currentAdmin?.fullName || user?.email || 'Admin', templateId: certType.toLowerCase().replace(/\s+/g, '_'), createdAt: new Date().toISOString() } as Certificate]);

        successCount++;
        setProgress({ current: successCount, total: selectedUids.length });
      }

      toast.success(`Successfully issued ${successCount} certificate(s) to participant(s)!`);
      setShowCreateModal(false);
      setSelectedUids([]);
      setWinnerPositions({});
    } catch (err: any) {
      toast.error(err.message || 'Issuance failed');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDeleteCertificate() {
    if (!deleteCertTarget) return;
    try {
      await deleteCertificate(deleteCertTarget.id);
      setCerts(prev => prev.filter(c => c.id !== deleteCertTarget.id));
      toast.success(`Deleted certificate ${deleteCertTarget.certificateId}`);
      setDeleteCertTarget(null);
    } catch { toast.error('Failed to delete certificate'); }
  }

  // Auto-select participants who attempted a specific contest from HackerRank results
  async function handleSelectFromContest(contestId: string) {
    setLoadingContestParticipants(true);
    try {
      const results = await getResultsByContest(contestId);
      const participantIds = new Set(results.map(r => r.participantId).filter(Boolean));
      const matchedUids = participants
        .filter(p => participantIds.has(p.participantId))
        .map(p => p.uid);
      if (matchedUids.length === 0) {
        toast.error('No matched participants found for this contest. Make sure results are imported.');
        return;
      }
      setSelectedUids(matchedUids);
      setCertType('Participation');
      const contest = contests.find(c => c.id === contestId);
      if (contest) setIssuedDateStr(contest.date);
      setContestPickerOpen(false);
      setShowCreateModal(true);
      toast.success(`${matchedUids.length} participants auto-selected from contest results!`);
    } catch {
      toast.error('Failed to load contest results');
    } finally {
      setLoadingContestParticipants(false);
    }
  }

  // Auto-select top 10 participants for winner certificates
  async function handleSelectWinnersFromContest(contestId: string) {
    setLoadingContestParticipants(true);
    try {
      const results = await getResultsByContest(contestId);
      // Sort by rank ascending first, then take top 10
      const top10 = results
        .filter(r => r.participantId)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 10);
      if (top10.length === 0) {
        toast.error('No results found for this contest. Import results first.');
        return;
      }
      const toOrdinal = (n: number) => {
        const s = ['th','st','nd','rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      // Build uid → position map IN rank order
      // Use index+1 as the position (not r.rank from DB) so it's always 1,2,3...
      const posMap: Record<string, string> = {};
      const matchedUids: string[] = [];
      let position = 1;
      for (const r of top10) {
        const p = participants.find(p => p.participantId === r.participantId);
        if (p) {
          matchedUids.push(p.uid);
          posMap[p.uid] = toOrdinal(position);
          position++;
        }
      }
      if (matchedUids.length === 0) {
        toast.error('Could not match top 10 to registered participants.');
        return;
      }
      setWinnerPositions(posMap);
      setSelectedUids(matchedUids);
      setCertType('Winner');
      setPosition('1st');
      const contest = contests.find(c => c.id === contestId);
      if (contest) setIssuedDateStr(contest.date);
      setWinnerPickerOpen(false);
      setShowCreateModal(true);
      toast.success(`Top ${matchedUids.length} winners auto-selected with correct positions!`);
    } catch {
      toast.error('Failed to load contest results');
    } finally {
      setLoadingContestParticipants(false);
    }
  }

  // Filtered participants for selector
  const filteredParticipants = participants.filter(p => {
    const matchSearch = !participantSearch ||
      p.fullName.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.participantId?.toLowerCase().includes(participantSearch.toLowerCase());
    const matchCollege = collegeFilter === 'all' || p.college === collegeFilter;
    const matchBranch = branchFilter === 'all' || p.branch === branchFilter;
    return matchSearch && matchCollege && matchBranch;
  });

  // Unique colleges and branches for filters
  const uniqueColleges = Array.from(new Set(participants.map(p => p.college))).sort();
  const uniqueBranches = Array.from(new Set(participants.map(p => p.branch))).sort();

  return (
    <div className="space-y-6">

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md flex items-center gap-2">
            <Award className="text-neon-cyan" size={24} />
            Certificate Management System
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            Admin-only issuance. Issue official certificates directly to participants.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWinnerPickerOpen(true)}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 bg-gold/10 border-gold/40 text-gold hover:bg-gold/20"
          >
            <Trophy size={14} /> Top 10 Winners
          </button>
          <button
            onClick={() => setContestPickerOpen(true)}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 bg-electric-blue/10 border-electric-blue/30 text-electric-blue hover:bg-electric-blue/20"
          >
            <Zap size={14} /> Bulk from Contest
          </button>
          <button
            onClick={() => {
              const foundingUids = participants.filter((p) => p.foundingMember).map((p) => p.uid);
              if (foundingUids.length === 0) {
                toast.error('No founding members found');
                return;
              }
              setCertType('Founding Member');
              setSelectedUids(foundingUids);
              setShowCreateModal(true);
            }}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
          >
            <Crown size={14} /> Issue Founding Certs
          </button>
          <button
            onClick={() => {
              setSelectedUids(participants.slice(0, 1).map((p) => p.uid));
              setShowCreateModal(true);
            }}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Plus size={14} /> Issue New Certificate
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Certificates', value: totalCerts, color: 'text-neon-cyan', icon: Award },
          { label: 'Issued to Students', value: issuedCerts, color: 'text-success', icon: CheckCircle2 },
          { label: 'Pending Approval', value: pendingCerts, color: 'text-gold', icon: Clock },
          { label: 'This Month', value: thisMonthCerts, color: 'text-electric-blue', icon: Sparkles },
        ].map((card) => (
          <div key={card.label} className="card p-4 space-y-2">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{card.label}</span>
              <card.icon size={16} className={card.color} />
            </div>
            <div className={`stat-number text-2xl ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              className="input-field pl-9 text-xs"
              placeholder="Search by ID, name, email, or contest…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Filter size={12} />
              <span>Type:</span>
              <select
                className="input-field text-xs py-1.5 px-2 bg-midnight/80"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {CERT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span>Status:</span>
              <select
                className="input-field text-xs py-1.5 px-2 bg-midnight/80"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Issued">Issued</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Data Table */}
      <div className="card p-0 overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-text-secondary font-heading uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contest / Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-secondary">
                    <Loader2 className="animate-spin inline-block mr-2" size={16} />
                    Loading certificates…
                  </td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-secondary">
                    No certificates found. Issue one to get started!
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-neon-cyan">
                      {cert.certificateId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{cert.participantName}</div>
                      <div className="text-[10px] text-text-secondary">{cert.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
                        {cert.certificateType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {cert.contestName}
                      {cert.position && <span className="ml-1.5 text-gold font-bold">({cert.position})</span>}
                    </td>
                    <td className="py-3 px-4">
                      {cert.status === 'Issued' ? (
                        <span className="inline-flex items-center gap-1 text-success text-[11px] font-semibold">
                          <CheckCircle2 size={12} /> Issued
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gold text-[11px] font-semibold">
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-secondary/70">
                      {cert.issuedDate || '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {/* Action: Preview */}
                      <button
                        onClick={() =>
                          setPreviewCert({
                            certificateId: cert.certificateId,
                            participantName: cert.participantName,
                            certificateType: cert.certificateType,
                            contestName: cert.contestName,
                            season: cert.season,
                            position: cert.position,
                            issuedDate: cert.issuedDate,
                          })
                        }
                        className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                        title="Preview Certificate"
                      >
                        <Eye size={13} />
                      </button>

                      {/* Action: Download directly */}
                      <button
                        onClick={() =>
                          downloadCertificate({
                            certificateId: cert.certificateId,
                            participantName: cert.participantName,
                            certificateType: cert.certificateType,
                            position: cert.position,
                            issuedDate: cert.issuedDate,
                          })
                        }
                        className="p-1.5 rounded hover:bg-white/10 text-neon-cyan transition-colors"
                        title="Download Certificate File"
                      >
                        <Download size={13} />
                      </button>

                      {/* Action: Send Email */}
                      <button
                        onClick={() => setEmailCertTarget(cert)}
                        className="p-1.5 rounded hover:bg-white/10 text-electric-blue transition-colors"
                        title="Send Certificate Email"
                      >
                        <Mail size={13} />
                      </button>

                      {/* Action: Delete */}
                      <button
                        onClick={() => setDeleteCertTarget(cert)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                        title="Delete Certificate"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: Single & Bulk Certificate Generation ── */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card border-neon-cyan/30 max-w-4xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="heading-sm text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-neon-cyan" />
                Issue Certificates to Participants (Single or Bulk)
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Controls */}
              <div className="space-y-4 text-xs">
                {/* Select Participants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="input-label mb-0">Select Participant(s) *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const top10 = filteredParticipants.slice(0, 10).map(p => p.uid);
                          setSelectedUids(top10);
                        }}
                        className="text-[10px] text-electric-blue hover:underline"
                      >
                        Top 10
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUids(
                            selectedUids.length === filteredParticipants.length
                              ? []
                              : filteredParticipants.map((p) => p.uid)
                          )
                        }
                        className="text-[10px] text-neon-cyan hover:underline"
                      >
                        {selectedUids.length === filteredParticipants.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>

                  {/* Search bar for participants */}
                  <div className="relative mb-2">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                    <input
                      className="input-field pl-8 py-1.5 text-xs"
                      placeholder="Search name, email, ID…"
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2 mb-2">
                    <select
                      className="input-field text-[10px] py-1 px-2 flex-1"
                      value={collegeFilter}
                      onChange={(e) => setCollegeFilter(e.target.value)}
                    >
                      <option value="all">All Colleges</option>
                      {uniqueColleges.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      className="input-field text-[10px] py-1 px-2 flex-1"
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                    >
                      <option value="all">All Branches</option>
                      {uniqueBranches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-white/10 rounded-lg p-2 bg-midnight/80 space-y-1">
                    {filteredParticipants.length === 0 ? (
                      <p className="text-[11px] text-text-secondary/50 text-center py-4">No participants found</p>
                    ) : (
                      filteredParticipants.map((p) => {
                        const selected = selectedUids.includes(p.uid);
                        return (
                          <label
                            key={p.uid}
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                              selected ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedUids((prev) => [...prev, p.uid]);
                                else setSelectedUids((prev) => prev.filter((id) => id !== p.uid));
                              }}
                              className="accent-[#00E5FF]"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-white font-medium text-xs block truncate">{p.fullName}</span>
                              <span className="text-[10px] text-text-secondary block truncate">{p.participantId} · {p.email}</span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">
                    Selected: <span className="text-neon-cyan font-bold">{selectedUids.length}</span> / Showing: <span className="text-white">{filteredParticipants.length}</span> / Total: {participants.length}
                  </p>
                </div>

                {/* Certificate Type */}
                <div>
                  <label className="input-label">Certificate Type *</label>
                  <select
                    className="input-field text-xs"
                    value={certType}
                    onChange={(e) => setCertType(e.target.value as CertificateType)}
                  >
                    {CERT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Inputs Based on Template Type */}
                {certType === 'Winner' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Rank / Position *</label>
                      <input
                        className="input-field text-xs font-semibold text-neon-cyan"
                        placeholder="e.g. 1st, 2nd, 3rd"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                      />
                      <p className="text-[10px] text-text-secondary mt-0.5">Template: Template.png (Winner)</p>
                    </div>
                    <div>
                      <label className="input-label">Held On Date *</label>
                      <input
                        className="input-field text-xs font-semibold text-white"
                        placeholder="e.g. 29th August 2026"
                        value={issuedDateStr}
                        onChange={(e) => setIssuedDateStr(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {certType === 'Participation' && (
                  <div>
                    <label className="input-label">Held On Date *</label>
                    <input
                      className="input-field text-xs font-semibold text-white"
                      placeholder="e.g. 29th August 2026"
                      value={issuedDateStr}
                      onChange={(e) => setIssuedDateStr(e.target.value)}
                    />
                    <p className="text-[10px] text-text-secondary mt-0.5">Template: Participation.png</p>
                  </div>
                )}

                {certType === 'Monthly Champion' && (
                  <div>
                    <label className="input-label">Month & Year *</label>
                    <input
                      className="input-field text-xs font-semibold text-gold"
                      placeholder="e.g. August 2026 or September 2026"
                      value={issuedDateStr}
                      onChange={(e) => setIssuedDateStr(e.target.value)}
                    />
                    <p className="text-[10px] text-text-secondary mt-0.5">Template: Monthlychampion.png (Fills: for the month of <span className="text-white font-bold">{issuedDateStr || 'August 2026'}</span>)</p>
                  </div>
                )}

                {certType === 'Founding Member' && (
                  <div>
                    <label className="input-label">Issued Date *</label>
                    <input
                      className="input-field text-xs font-semibold text-gold"
                      placeholder="e.g. 29th August 2026"
                      value={issuedDateStr}
                      onChange={(e) => setIssuedDateStr(e.target.value)}
                    />
                    <p className="text-[10px] text-text-secondary mt-0.5">Template: Participation.png (Fills: Founding Member title, name, season {season})</p>
                  </div>
                )}

                {/* Progress Bar during Bulk Generation */}
                {isGenerating && (
                  <div className="space-y-1 bg-neon-cyan/5 border border-neon-cyan/20 p-3 rounded-lg">
                    <div className="flex justify-between text-[11px] text-neon-cyan font-bold">
                      <span>Issuing Certificates…</span>
                      <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-neon-cyan h-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Form Canvas Preview */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Live Certificate Template Preview
                </div>
                <div className="border border-white/10 rounded-lg bg-black p-2 flex items-center justify-center overflow-hidden">
                  <canvas ref={inlineCanvasRef} className="w-full h-auto rounded shadow-lg" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary text-xs px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAndIssue}
                disabled={isGenerating || selectedUids.length === 0}
                className="btn-primary text-xs px-6 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Issuing ({progress.current}/{progress.total})…
                  </>
                ) : (
                  <>
                    <Award size={13} /> Issue Certificates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 2: Full Certificate Canvas Preview ── */}
      {previewCert && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-4xl w-full p-5 space-y-4 border-neon-cyan/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-heading text-sm font-bold text-neon-cyan">{previewCert.certificateId}</h3>
                <p className="text-xs text-text-secondary">{previewCert.participantName} · {previewCert.certificateType}</p>
              </div>
              <button onClick={() => setPreviewCert(null)} className="text-text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="bg-black border border-white/10 p-2 rounded-lg flex justify-center">
              <canvas ref={modalCanvasRef} className="w-full h-auto rounded shadow-2xl" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => downloadCertificate(previewCert)}
                className="btn-primary text-xs px-4 flex items-center gap-1.5"
              >
                <Download size={13} /> Download Certificate Image
              </button>
              <button onClick={() => setPreviewCert(null)} className="btn-secondary text-xs px-4">
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 3: Email Certificate ── */}
      {emailCertTarget && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-md w-full p-6 space-y-4 border-neon-cyan/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                <Mail size={16} className="text-electric-blue" />
                Send Certificate Notice
              </h3>
              <button onClick={() => setEmailCertTarget(null)} className="text-text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-text-secondary">
              <p>Recipient: <span className="text-white font-bold">{emailCertTarget.participantName}</span> ({emailCertTarget.email})</p>
              <p>Certificate ID: <span className="text-neon-cyan font-mono">{emailCertTarget.certificateId}</span></p>
              <p className="text-[11px] leading-relaxed pt-2">
                This will open your email client with instructions for the student to view and download their official certificate from their student dashboard.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEmailCertTarget(null)} className="btn-secondary flex-1 text-xs">
                Cancel
              </button>
              <a
                href={`mailto:${emailCertTarget.email}?subject=${encodeURIComponent(
                  `Your CWCL Certificate: ${emailCertTarget.certificateId}`
                )}&body=${encodeURIComponent(
                  `Dear ${emailCertTarget.participantName},\n\nCongratulations! Your certificate for ${emailCertTarget.contestName} (${emailCertTarget.certificateType}) has been officially issued!\n\nYou can view and download your certificate anytime from your Student Dashboard under "My Certificates":\n${window.location.origin}/dashboard/certificates\n\nVerify Online: ${window.location.origin}/verify/${emailCertTarget.certificateId}\n\nBest regards,\nCWCL Team`
                )}`}
                onClick={() => {
                  toast.success('Email client launched!');
                  setEmailCertTarget(null);
                }}
                className="btn-primary flex-1 text-xs flex items-center justify-center gap-1.5"
              >
                <Mail size={13} /> Launch Email Client
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 4: Delete Confirmation ── */}
      {deleteCertTarget && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-md w-full p-6 space-y-4 border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-heading text-sm font-bold">Delete Certificate?</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to delete <span className="text-neon-cyan font-mono">{deleteCertTarget.certificateId}</span> issued to <span className="text-white font-semibold">{deleteCertTarget.participantName}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteCertTarget(null)} className="btn-secondary flex-1 text-xs">
                Cancel
              </button>
              <button onClick={handleDeleteCertificate} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 text-xs flex-1 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 5: Contest Picker for Bulk Participation Certs ── */}
      {contestPickerOpen && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border-electric-blue/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-heading text-sm font-bold flex items-center gap-2 text-electric-blue">
                <Zap size={16} /> Bulk Participation Certs from Contest
              </h3>
              <button onClick={() => setContestPickerOpen(false)} className="text-text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              Select a completed contest. Only participants who actually attempted it (from imported results) will be auto-selected.
            </p>
            {contests.length === 0 ? (
              <p className="text-xs text-amber-400 text-center py-4">No completed contests found. Import results first.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contests.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectFromContest(c.id)}
                    disabled={loadingContestParticipants}
                    className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-electric-blue/40 hover:bg-electric-blue/5 transition-all disabled:opacity-50"
                  >
                    <div className="text-white text-xs font-semibold">{c.name}</div>
                    <div className="text-text-secondary text-[10px] mt-0.5">{c.date} · {c.platform || c.mode}</div>
                  </button>
                ))}
              </div>
            )}
            {loadingContestParticipants && (
              <div className="flex items-center justify-center gap-2 text-xs text-neon-cyan">
                <Loader2 size={14} className="animate-spin" /> Loading participants…
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL 6: Contest Picker for Top 10 Winner Certs ── */}
      {winnerPickerOpen && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#070d1a]/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border-gold/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-heading text-sm font-bold flex items-center gap-2 text-gold">
                <Trophy size={16} /> Top 10 Winner Certs from Contest
              </h3>
              <button onClick={() => setWinnerPickerOpen(false)} className="text-text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              Select a contest — top 10 ranked participants will be auto-selected with cert type set to <span className="text-gold font-semibold">Winner</span>.
            </p>
            {contests.length === 0 ? (
              <p className="text-xs text-amber-400 text-center py-4">No completed contests found. Import results first.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contests.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectWinnersFromContest(c.id)}
                    disabled={loadingContestParticipants}
                    className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-gold/40 hover:bg-gold/5 transition-all disabled:opacity-50"
                  >
                    <div className="text-white text-xs font-semibold">{c.name}</div>
                    <div className="text-text-secondary text-[10px] mt-0.5">{c.date} · {c.platform || c.mode}</div>
                  </button>
                ))}
              </div>
            )}
            {loadingContestParticipants && (
              <div className="flex items-center justify-center gap-2 text-xs text-gold">
                <Loader2 size={14} className="animate-spin" /> Loading top 10…
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
