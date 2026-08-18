import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown, Users, Download, Search, Calendar,
  FileSpreadsheet, Award, Loader2, UserPlus,
} from 'lucide-react';
import type { Participant } from '../../types';
import { downloadFoundingCertificate } from '../../lib/certificateGenerator';
import { downloadFoundingBadge } from '../../components/ui/FoundingMemberBadge';
import { assignFoundingMember } from '../../lib/foundingMembers';
import { getParticipants, getSetting, invalidateParticipantsCache } from '../../lib/db';
import toast from 'react-hot-toast';

export default function FoundingMembersAdmin() {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availableSearch, setAvailableSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'awarded' | 'assign'>('awarded');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState<'badges' | 'certs' | null>(null);
  const [maxSlots, setMaxSlots] = useState(20);

  useEffect(() => {
    Promise.all([
      getParticipants(2000),
      getSetting('foundingMembers'),
    ]).then(([parts, settings]) => {
      setAllParticipants(parts.filter(p => p.role !== 'admin' && p.role !== 'super_admin'));
      if (settings?.maxFoundingMembers) setMaxSlots(Number(settings.maxFoundingMembers) || 20);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const members = useMemo(() => {
    return allParticipants
      .filter(p => p.foundingMember === true)
      .sort((a, b) => (a.foundingRank ?? 0) - (b.foundingRank ?? 0));
  }, [allParticipants]);

  const available = useMemo(() => {
    return allParticipants
      .filter(p => p.foundingMember !== true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allParticipants]);

  const filteredMembers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return members;
    return members.filter(p =>
      p.fullName.toLowerCase().includes(s) ||
      p.participantId.toLowerCase().includes(s) ||
      p.college.toLowerCase().includes(s)
    );
  }, [members, search]);

  const filteredAvailable = useMemo(() => {
    const s = availableSearch.trim().toLowerCase();
    if (!s) return available;
    return available.filter(p =>
      p.fullName.toLowerCase().includes(s) ||
      p.participantId.toLowerCase().includes(s) ||
      p.college.toLowerCase().includes(s) ||
      p.email.toLowerCase().includes(s)
    );
  }, [available, availableSearch]);

  const stats = useMemo(() => {
    const awarded = members.map(p => p.foundingAwardedAt ? new Date(p.foundingAwardedAt).getTime() : 0).filter(t => t > 0);
    const avgMs = awarded.length ? awarded.reduce((a, b) => a + b, 0) / awarded.length : 0;
    const latestMs = awarded.length ? Math.max(...awarded) : 0;
    return {
      count: members.length,
      remaining: Math.max(0, maxSlots - members.length),
      avgDate: avgMs ? new Date(avgMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      latestDate: latestMs ? new Date(latestMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      latestMember: members.find(p => p.foundingAwardedAt && new Date(p.foundingAwardedAt).getTime() === latestMs),
    };
  }, [members, maxSlots]);

  async function handleAssign(uid: string, name: string) {
    setAssigningId(uid);
    try {
      const result = await assignFoundingMember(uid);
      invalidateParticipantsCache(); // founding_member fields + badges changed
      toast.success(`${name} is now Founding Member #${result?.rank ?? ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign founding member');
    } finally {
      setAssigningId(null);
    }
  }

  function exportCSV() {
    const headers = ['Rank', 'Participant ID', 'Name', 'Email', 'College', 'Branch', 'Year', 'Phone', 'Awarded At', 'Season'];
    const rows = members.map(p => [
      p.foundingRank,
      p.participantId,
      p.fullName,
      p.email,
      p.college,
      p.branch,
      p.year,
      p.phone,
      p.foundingAwardedAt ? new Date(p.foundingAwardedAt).toLocaleDateString('en-IN') : '',
      p.foundingSeasonId || '2026–27',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CWCL_FoundingMembers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }

  async function bulkDownloadBadges() {
    setBulkDownloading('badges');
    toast.loading('Preparing badges…', { id: 'bulk-badge' });
    for (let i = 0; i < members.length; i++) {
      const p = members[i];
      downloadFoundingBadge(p.participantId, p.foundingSeasonId || '2026–27');
      await new Promise(r => setTimeout(r, 400));
    }
    toast.success('All badge downloads started', { id: 'bulk-badge' });
    setBulkDownloading(null);
  }

  async function bulkDownloadCerts() {
    setBulkDownloading('certs');
    toast.loading('Preparing certificates…', { id: 'bulk-cert' });
    for (let i = 0; i < members.length; i++) {
      const p = members[i];
      try {
        await downloadFoundingCertificate({
          certificateId: `CWCL-FM-${p.participantId}`,
          participantName: p.fullName,
          season: p.foundingSeasonId || '2026–27',
          issuedDate: p.foundingAwardedAt
            ? new Date(p.foundingAwardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        });
      } catch {
        toast.error(`Failed for ${p.fullName}`, { id: 'bulk-cert' });
      }
      await new Promise(r => setTimeout(r, 600));
    }
    toast.success('All certificate downloads started', { id: 'bulk-cert' });
    setBulkDownloading(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md flex items-center gap-2">
          <Crown className="text-gold" size={24} />
          Founding Members
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Assign remaining slots to early participants. New registrations from #{members.length + 1} onwards will receive founding status automatically.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 space-y-1">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1"><Users size={11} /> Claimed</div>
          <div className="stat-number text-2xl text-gold">{stats.count} <span className="text-text-secondary/50 text-base">/ {maxSlots}</span></div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1"><Award size={11} /> Remaining</div>
          <div className={`stat-number text-2xl ${stats.remaining === 0 ? 'text-text-secondary' : 'text-neon-cyan'}`}>{stats.remaining}</div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1"><Calendar size={11} /> Latest</div>
          <div className="text-white text-xs font-medium mt-1 truncate">{stats.latestMember?.fullName || '—'}</div>
          <div className="text-text-secondary/60 text-[10px]">{stats.latestDate}</div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1"><Users size={11} /> Total Registered</div>
          <div className="stat-number text-2xl text-electric-blue">{allParticipants.length}</div>
          <div className="text-text-secondary/60 text-[10px]">Avg awarded: {stats.avgDate}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('awarded')}
          className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'awarded'
              ? 'text-gold border-gold'
              : 'text-text-secondary border-transparent hover:text-white'
          }`}
        >
          Awarded ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'assign'
              ? 'text-neon-cyan border-neon-cyan'
              : 'text-text-secondary border-transparent hover:text-white'
          }`}
        >
          Assign Slots ({available.length})
        </button>
      </div>

      {activeTab === 'awarded' ? (
        <>
          {/* Toolbar */}
          <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
              <input
                className="input-field pl-9 text-xs"
                placeholder="Search by name, ID, or college…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportCSV} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                <FileSpreadsheet size={13} /> Export CSV
              </button>
              <button
                onClick={bulkDownloadBadges}
                disabled={bulkDownloading === 'badges' || members.length === 0}
                className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20 disabled:opacity-50"
              >
                {bulkDownloading === 'badges' ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />}
                Download All Badges
              </button>
              <button
                onClick={bulkDownloadCerts}
                disabled={bulkDownloading === 'certs' || members.length === 0}
                className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              >
                {bulkDownloading === 'certs' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Download All Certs
              </button>
            </div>
          </div>

          {/* Awarded Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-text-secondary uppercase text-[10px] tracking-wider">
                  <tr className="border-b border-white/10">
                    {['Rank', 'Participant', 'College', 'Awarded At', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-text-secondary">
                      <Loader2 className="animate-spin inline-block mr-2" size={16} /> Loading…
                    </td></tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-text-secondary">No founding members found.</td></tr>
                  ) : filteredMembers.map(p => (
                    <tr key={p.uid} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-numbers text-gold font-bold">#{p.foundingRank}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                            {p.photoURL ? (
                              <img src={p.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span className="font-heading text-[10px] text-gold font-bold">{p.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{p.fullName}</div>
                            <div className="text-[10px] text-text-secondary/60 font-mono">{p.participantId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{p.college}</td>
                      <td className="py-3 px-4 text-text-secondary/70">
                        {p.foundingAwardedAt ? new Date(p.foundingAwardedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Link to={`/profile/${p.participantId}`} target="_blank"
                            className="p-1.5 rounded hover:bg-white/10 text-neon-cyan transition-colors" title="View Public Profile">
                            <Users size={13} />
                          </Link>
                          <button
                            onClick={() => downloadFoundingBadge(p.participantId, p.foundingSeasonId || '2026–27')}
                            className="p-1.5 rounded hover:bg-white/10 text-gold transition-colors" title="Download Badge">
                            <Crown size={13} />
                          </button>
                          <button
                            onClick={() => {
                              toast.loading('Generating certificate…', { id: `fm-cert-${p.uid}` });
                              downloadFoundingCertificate({
                                certificateId: `CWCL-FM-${p.participantId}`,
                                participantName: p.fullName,
                                season: p.foundingSeasonId || '2026–27',
                                issuedDate: p.foundingAwardedAt
                                  ? new Date(p.foundingAwardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                  : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                              }).then(() => toast.success('Certificate downloaded!', { id: `fm-cert-${p.uid}` }))
                                .catch(() => toast.error('Download failed', { id: `fm-cert-${p.uid}` }));
                            }}
                            className="p-1.5 rounded hover:bg-white/10 text-neon-cyan transition-colors" title="Download Certificate">
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Assignment Toolbar */}
          <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
              <input
                className="input-field pl-9 text-xs"
                placeholder="Search participants by name, ID, college, or email…"
                value={availableSearch}
                onChange={e => setAvailableSearch(e.target.value)}
              />
            </div>
            <div className={`text-xs ${stats.remaining === 0 ? 'text-red-400' : 'text-text-secondary'}`}>
              {stats.remaining === 0
                ? 'All founding slots are claimed.'
                : `${stats.remaining} slot${stats.remaining === 1 ? '' : 's'} remaining.`}
            </div>
          </div>

          {/* Assignment Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-text-secondary uppercase text-[10px] tracking-wider">
                  <tr className="border-b border-white/10">
                    {['Participant', 'College', 'Registered', 'Action'].map(h => (
                      <th key={h} className="py-3 px-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={4} className="py-12 text-center text-text-secondary">
                      <Loader2 className="animate-spin inline-block mr-2" size={16} /> Loading…
                    </td></tr>
                  ) : filteredAvailable.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-text-secondary">
                      {availableSearch ? 'No participants match your search.' : 'All participants have been awarded founding status.'}
                    </td></tr>
                  ) : filteredAvailable.map(p => (
                    <tr key={p.uid} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                            {p.photoURL ? (
                              <img src={p.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span className="font-heading text-[10px] text-neon-cyan font-bold">{p.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{p.fullName}</div>
                            <div className="text-[10px] text-text-secondary/60 font-mono">{p.participantId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{p.college}</td>
                      <td className="py-3 px-4 text-text-secondary/70">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleAssign(p.uid, p.fullName)}
                          disabled={assigningId === p.uid || stats.remaining === 0}
                          className="btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {assigningId === p.uid ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <UserPlus size={11} />
                          )}
                          Assign Founding
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
