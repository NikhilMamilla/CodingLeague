import { useEffect, useState } from 'react';
import { evaluateAndAwardBadges, evaluateAllParticipants, awardBadge, revokeBadge } from '../../lib/badges';
import type { Participant, BadgeType } from '../../types';
import { BADGE_META } from '../../types';
import { Shield, Play, Zap, Award, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getParticipants } from '../../lib/db';

export default function ManageBadges() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showAwardModal, setShowAwardModal] = useState(false);

  useEffect(() => {
    getParticipants(500).then(data => {
      setParticipants(data.filter(p => p.role !== 'admin'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = participants.filter(p =>
    !search ||
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.participantId?.toLowerCase().includes(search.toLowerCase()) ||
    p.college?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleEvaluateOne(p: Participant) {
    setProcessing(true);
    try {
      const awarded = await evaluateAndAwardBadges(p.uid);
      if (awarded.length > 0) {
        toast.success(`🎖️ Awarded ${awarded.length} badge${awarded.length !== 1 ? 's' : ''} to ${p.fullName}!`);
      } else {
        toast(`No new badges for ${p.fullName}`, { icon: 'ℹ️' });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to evaluate badges');
    } finally {
      setProcessing(false);
    }
  }

  async function handleEvaluateAll() {
    if (!confirm(`Re-evaluate badges for all ${participants.length} participants?\n\nThis will scan all contest results and award any missing badges.`)) {
      return;
    }
    setBulkProcessing(true);
    try {
      const summary = await evaluateAllParticipants();
      const totalAwarded = Object.values(summary).flat().length;
      const affectedCount = Object.keys(summary).length;
      if (totalAwarded > 0) {
        toast.success(`✅ Awarded ${totalAwarded} badge${totalAwarded !== 1 ? 's' : ''} to ${affectedCount} participant${affectedCount !== 1 ? 's' : ''}!`, { duration: 5000 });
      } else {
        toast('All participants are up to date!', { icon: '✨' });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Bulk evaluation failed');
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleManualAward(p: Participant, type: BadgeType) {
    try {
      const added = await awardBadge(p.uid, type);
      if (added) {
        toast.success(`🎖️ Awarded "${BADGE_META[type].label}" to ${p.fullName}!`);
      } else {
        toast(`${p.fullName} already has this badge`, { icon: 'ℹ️' });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to award badge');
    }
  }

  async function handleRevoke(p: Participant, type: BadgeType) {
    if (!confirm(`Revoke "${BADGE_META[type].label}" from ${p.fullName}?`)) return;
    try {
      const removed = await revokeBadge(p.uid, type);
      if (removed) {
        toast.success(`Revoked "${BADGE_META[type].label}" from ${p.fullName}`);
      } else {
        toast(`${p.fullName} doesn't have this badge`, { icon: 'ℹ️' });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to revoke badge');
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="heading-md">Manage Badges</h1>
        <p className="text-text-secondary text-xs mt-1">
          Award, revoke, and auto-evaluate achievement badges for all participants.
        </p>
      </div>

      {/* Actions bar */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <button onClick={handleEvaluateAll} disabled={bulkProcessing || loading}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 disabled:opacity-50">
            <Zap size={12} />
            {bulkProcessing ? 'Evaluating…' : 'Evaluate All'}
          </button>
          <div className="text-text-secondary text-[10px] leading-relaxed max-w-md">
            Scans all participants' contest results and auto-awards badges based on achievements
            (10 contests, first win, top 10, perfect score, etc.).
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
          <input className="input-field pl-9 py-2 text-xs" placeholder="Search participant…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Participant table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body min-w-[800px]">
            <thead className="bg-[#070d1a]">
              <tr className="border-b border-neon-cyan/10">
                {['Participant', 'College', 'Rating', 'Contests', 'Current Badges', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-secondary">
                  <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-secondary">
                  {participants.length === 0 ? 'No participants yet.' : 'No results found.'}
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.uid} className="hover:bg-neon-cyan/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                        <span className="font-heading text-[11px] text-neon-cyan font-bold">
                          {p.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">{p.fullName}</div>
                        <div className="text-text-secondary/60 text-[10px] font-numbers">{p.participantId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs max-w-[200px] truncate">{p.college}</td>
                  <td className="px-4 py-3 font-numbers text-neon-cyan font-bold">{p.rating}</td>
                  <td className="px-4 py-3 font-numbers text-text-secondary">{p.contestsParticipated}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.badges && p.badges.length > 0 ? (
                        p.badges.map(b => {
                          const meta = BADGE_META[b.type];
                          return (
                            <div key={b.type}
                              className="group relative flex items-center gap-1 px-1.5 py-0.5 rounded bg-midnight border border-neon-cyan/20 hover:border-neon-cyan/40 transition-colors cursor-pointer"
                              title={meta?.label}>
                              <span className="text-xs">{meta?.emoji}</span>
                              <button onClick={() => handleRevoke(p, b.type)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={10} className="text-red-400 hover:text-red-300" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-text-secondary/40 text-[10px]">none</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEvaluateOne(p)} disabled={processing}
                        className="text-neon-cyan text-[10px] hover:underline disabled:opacity-50 flex items-center gap-1">
                        <Play size={10} /> Auto-Award
                      </button>
                      <button onClick={() => { setSelectedParticipant(p); setShowAwardModal(true); }}
                        className="text-electric-blue text-[10px] hover:underline flex items-center gap-1">
                        <Award size={10} /> Manual
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual award modal */}
      {showAwardModal && selectedParticipant && (() => {
        // Always get the freshest version from the live list
        const liveParticipant = participants.find(p => p.uid === selectedParticipant.uid) ?? selectedParticipant;
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAwardModal(false)}>
            <div className="card max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neon-cyan/10">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-neon-cyan" />
                  <h2 className="font-heading text-sm font-bold text-neon-cyan">Award Badge Manually</h2>
                </div>
                <button onClick={() => setShowAwardModal(false)} className="text-text-secondary hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <p className="text-text-secondary text-xs mb-4">
                Award a badge to <strong className="text-white">{liveParticipant.fullName}</strong>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(BADGE_META) as BadgeType[]).map(type => {
                  const meta = BADGE_META[type];
                  const has  = (liveParticipant.badges ?? []).some(b => b.type === type);
                  return (
                    <button key={type} onClick={() => handleManualAward(liveParticipant, type)}
                      disabled={has}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                        has
                          ? 'bg-midnight/30 border-white/5 opacity-40 cursor-not-allowed'
                          : 'bg-midnight border-neon-cyan/20 hover:border-neon-cyan/50 hover:bg-midnight/80'
                      }`}>
                      <span className="text-2xl">{meta.emoji}</span>
                      <span className="text-[10px] text-text-secondary text-center leading-tight">{meta.label}</span>
                      {has && <span className="text-[9px] text-success">✓ Awarded</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
