import React, { useEffect, useState, useRef } from 'react';
import type { Contest, ContestDifficulty } from '../../types';
import { getTierFromRating } from '../../types';
import { evaluateAndAwardBadges } from '../../lib/badges';
import {
  calculateCWCLRatingChanges, TIER_CONFIG, DIFFICULTY_MULTIPLIERS,
  getSizeMultiplier, type RatingCalculationResult,
} from '../../lib/ratingEngine';
import { Upload, FileText, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractHandle } from '../../lib/profileVerification';
import { getContests, getParticipants, insertResult, updateContest, updateParticipant } from '../../lib/db';

interface ParsedRow {
  rank: number;
  name: string;
  score: number;
  penalty: number;
  solved?: number;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rankIdx = headers.findIndex((h) => h.includes('rank'));
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('handle'));
  const scoreIdx = headers.findIndex((h) => h.includes('score') || h.includes('point'));
  const penaltyIdx = headers.findIndex((h) => h.includes('penalty'));
  const solvedIdx = headers.findIndex((h) => h.includes('solved'));

  if (rankIdx < 0 || nameIdx < 0 || scoreIdx < 0 || penaltyIdx < 0) return [];

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => {
      const cols = l.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      return {
        rank: parseInt(cols[rankIdx]) || 0,
        name: cols[nameIdx] || '',
        score: parseFloat(cols[scoreIdx]) || 0,
        penalty: parseFloat(cols[penaltyIdx]) || 0,
        solved: solvedIdx >= 0 ? parseInt(cols[solvedIdx]) || 0 : 0,
      };
    })
    .filter((r) => r.rank > 0);
}

export default function ImportResults() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selected, setSelected] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);

  // Calculated Ratings Preview
  const [previewCalculations, setPreviewCalculations] = useState<RatingCalculationResult[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  // Load contests and participants once
  useEffect(() => {
    getContests().then(list => setContests(list.sort((a, b) => b.date.localeCompare(a.date)))).catch(() => {});
    getParticipants(2000).then(list => setAllParticipants(list.map(p => ({ ...p, docId: p.uid })))).catch(() => {});
  }, []);

  // Re-calculate preview whenever rows, selected contest, or participants update
  useEffect(() => {
    if (rows.length === 0 || !selected) {
      setPreviewCalculations([]);
      return;
    }

    const contest = contests.find((c) => c.id === selected);
    const difficulty: ContestDifficulty = contest?.difficulty ?? 'Easy';

    const inputs = rows.map((row) => {
      const rawTarget = row.name.trim().toLowerCase();
      const targetCleanHandle = extractHandle('generic', row.name).toLowerCase();

      const match = allParticipants.find((p: any) => {
        if (p.fullName?.toLowerCase() === rawTarget) return true;
        if (p.participantId?.toLowerCase() === rawTarget) return true;

        const cfHandle = p.codeforcesHandle ? extractHandle('codeforcesHandle', p.codeforcesHandle).toLowerCase() : '';
        const lcHandle = p.leetcodeUsername ? extractHandle('leetcodeUsername', p.leetcodeUsername).toLowerCase() : '';
        const ccHandle = p.codechefUsername ? extractHandle('codechefUsername', p.codechefUsername).toLowerCase() : '';
        const hrHandle = p.hackerrankUsername ? extractHandle('hackerrankUsername', p.hackerrankUsername).toLowerCase() : '';
        const gfgHandle = p.gfgUsername ? extractHandle('gfgUsername', p.gfgUsername).toLowerCase() : '';

        return (
          cfHandle === rawTarget || cfHandle === targetCleanHandle ||
          lcHandle === rawTarget || lcHandle === targetCleanHandle ||
          ccHandle === rawTarget || ccHandle === targetCleanHandle ||
          hrHandle === rawTarget || hrHandle === targetCleanHandle ||
          gfgHandle === rawTarget || gfgHandle === targetCleanHandle ||
          p.codeforcesHandle?.toLowerCase() === rawTarget ||
          p.leetcodeUsername?.toLowerCase() === rawTarget ||
          p.codechefUsername?.toLowerCase() === rawTarget ||
          p.hackerrankUsername?.toLowerCase() === rawTarget ||
          p.gfgUsername?.toLowerCase() === rawTarget
        );
      });

      return {
        rank: row.rank,
        participantId: match?.participantId ?? undefined,
        participantName: row.name,
        currentRating: match?.rating ?? 800,
        score: row.score,
        penalty: row.penalty,
        solved: row.solved,
        currentStreak: match?.streak ?? 0,
      };
    });

    const calculated = calculateCWCLRatingChanges(inputs, difficulty);
    setPreviewCalculations(calculated);
  }, [rows, selected, allParticipants, contests]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('Could not parse file. Ensure headers include Rank, Name, Score, Penalty.');
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!selected) { toast.error('Select a contest first'); return; }
    if (rows.length === 0) { toast.error('No data to import'); return; }
    setSubmitting(true);
    try {
      const contest = contests.find((c) => c.id === selected)!;
      const allParts = allParticipants;
      const completedContests = contests.filter(c => c.status === 'Completed').length;
      const totalContests = completedContests + 1;
      const matchedUids: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const calcRes = previewCalculations[i];
        const rawTarget = row.name.trim().toLowerCase();
        const targetCleanHandle = extractHandle('generic', row.name).toLowerCase();

        const match = allParts.find((p: any) => {
          if (p.fullName?.toLowerCase() === rawTarget) return true;
          if (p.participantId?.toLowerCase() === rawTarget) return true;
          const cf = p.codeforcesHandle ? extractHandle('codeforcesHandle', p.codeforcesHandle).toLowerCase() : '';
          const lc = p.leetcodeUsername ? extractHandle('leetcodeUsername', p.leetcodeUsername).toLowerCase() : '';
          const cc = p.codechefUsername ? extractHandle('codechefUsername', p.codechefUsername).toLowerCase() : '';
          const hr = p.hackerrankUsername ? extractHandle('hackerrankUsername', p.hackerrankUsername).toLowerCase() : '';
          const gfg = p.gfgUsername ? extractHandle('gfgUsername', p.gfgUsername).toLowerCase() : '';
          return cf === rawTarget || cf === targetCleanHandle || lc === rawTarget || lc === targetCleanHandle ||
            cc === rawTarget || cc === targetCleanHandle || hr === rawTarget || hr === targetCleanHandle ||
            gfg === rawTarget || gfg === targetCleanHandle ||
            p.codeforcesHandle?.toLowerCase() === rawTarget || p.leetcodeUsername?.toLowerCase() === rawTarget ||
            p.codechefUsername?.toLowerCase() === rawTarget || p.hackerrankUsername?.toLowerCase() === rawTarget ||
            p.gfgUsername?.toLowerCase() === rawTarget;
        });

        const ratingBefore = calcRes ? calcRes.previousRating : match?.rating ?? 800;
        const ratingAfter  = calcRes ? calcRes.newRating      : ratingBefore;
        const ratingChange = calcRes ? calcRes.ratingChange    : 0;
        const leaguePoints = calcRes ? calcRes.leaguePoints    : 10;
        const newTier = getTierFromRating(ratingAfter);

        await insertResult({
          contestId: selected, contestName: contest.name,
          participantId: match?.participantId ?? null, participantName: row.name,
          college: match?.college ?? 'Unknown', rank: row.rank, score: row.score,
          penalty: row.penalty, problemsSolved: row.solved ?? 0, leaguePoints,
          ratingBefore, ratingAfter, ratingChange,
          importedAt: new Date().toISOString(),
        } as any);

        if (match?.uid) {
          matchedUids.push(match.uid);
          const newContestsCount = (match.contestsParticipated ?? 0) + 1;
          const newAttendance = Math.min(100, Math.round((newContestsCount / totalContests) * 100));
          const currentPeakRating = Math.max(match.peakRating ?? 800, ratingAfter);
          const existingHistory: any[] = Array.isArray(match.ratingHistory) ? match.ratingHistory : [];
          await updateParticipant(match.uid, {
            rating: ratingAfter, tier: newTier,
            peak_rating: currentPeakRating, peak_title: getTierFromRating(currentPeakRating),
            monthly_points: (match.monthlyPoints ?? 0) + leaguePoints,
            streak: (match.streak ?? 0) + 1, last_contest_date: contest.date,
            contests_participated: newContestsCount, attendance: newAttendance,
            rating_history: [...existingHistory, { contestId: selected, contestName: contest.name, contestDate: contest.date, rank: row.rank, previousRating: ratingBefore, newRating: ratingAfter, ratingChange }],
          });
        }
      }

      await updateContest(selected, { status: 'Completed', ratingCalculated: true, resultsPublished: true, lockedAt: new Date().toISOString() } as any);
      toast.success(`✅ CWCL v1.0 Rating calculations published for ${contest.name}!`);

      let badgeCount = 0;
      for (const uid of matchedUids) {
        try { const awarded = await evaluateAndAwardBadges(uid); badgeCount += awarded.length; } catch { /**/ }
      }
      if (badgeCount > 0) toast.success(`🎖️ Awarded ${badgeCount} new badge${badgeCount !== 1 ? 's' : ''}!`);

      setRows([]); setFileName(''); setSelected('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      toast.error(e.message ?? 'Import failed');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedContest = contests.find((c) => c.id === selected);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md flex items-center gap-2">
            <Shield className="text-neon-cyan" size={24} />
            CWCL Rating System v1.0 Result Manager
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            Upload CSV results, preview Elo rating changes, and publish official League Points.
          </p>
        </div>
      </div>

      {/* Select Contest */}
      <div className="card space-y-4">
        <h2 className="heading-sm flex items-center gap-2">
          <span>1. Select Contest</span>
          {selectedContest && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-numbers font-semibold ${
                selectedContest.ratingCalculated
                  ? 'bg-success/10 text-success border border-success/30'
                  : 'bg-warning/10 text-warning border border-warning/30'
              }`}
            >
              {selectedContest.ratingCalculated ? 'Rating Locked' : 'Pending Calculation'}
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Contest</label>
            <select className="input-field" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">-- Select a contest --</option>
              {contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.difficulty || 'Easy'} · {c.date}) {c.ratingCalculated ? '🔒' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedContest && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Difficulty Multiplier:</span>
                <span className="text-neon-cyan font-numbers font-bold">
                  {selectedContest.difficulty || 'Easy'} (
                  {DIFFICULTY_MULTIPLIERS[selectedContest.difficulty || 'Easy']}x)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Field Size Multiplier:</span>
                <span className="text-electric-blue font-numbers font-bold">
                  {rows.length} players ({getSizeMultiplier(rows.length)}x)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload CSV */}
      <div className="card space-y-4">
        <h2 className="heading-sm">2. Upload Contest CSV</h2>
        <div className="flex items-center gap-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg px-4 py-3">
          <AlertCircle size={14} className="text-neon-cyan shrink-0" />
          <p className="text-neon-cyan/90 text-xs">
            Required headers: <strong>Rank, Name, Score, Penalty</strong> (Optional: <strong>Solved</strong>)
          </p>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-neon-cyan/20 hover:border-neon-cyan/40 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
          <Upload size={28} className="text-neon-cyan/40 mx-auto mb-3" />
          {fileName ? (
            <div className="flex items-center justify-center gap-2">
              <FileText size={14} className="text-neon-cyan" />
              <span className="text-white text-sm">{fileName}</span>
            </div>
          ) : (
            <>
              <p className="text-text-secondary text-sm">Click to upload CSV results</p>
              <p className="text-text-secondary/60 text-xs mt-1">CSV files supported</p>
            </>
          )}
        </div>
      </div>

      {/* Live Preview Table */}
      {previewCalculations.length > 0 && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <h2 className="heading-sm">3. CWCL Rating System v1.0 Live Calculation Preview</h2>
            </div>
            <span className="text-xs text-text-secondary">
              Total Participants: <strong className="text-neon-cyan">{previewCalculations.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs font-body">
              <thead className="sticky top-0 bg-card-dark z-10">
                <tr className="text-text-secondary border-b border-neon-cyan/10">
                  <th className="text-left py-2 pr-3 text-[10px] uppercase">Rank</th>
                  <th className="text-left py-2 pr-3 text-[10px] uppercase">Name</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">Prev Rating</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">Base / Exp</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">Upset / Streak</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">Rating Delta</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">New Rating</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">Title</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">LP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-cyan/5">
                {previewCalculations.map((calc, i) => {
                  const cfg = TIER_CONFIG[calc.newTier];
                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-2 pr-3 font-numbers text-text-secondary">#{calc.rank}</td>
                      <td className="py-2 pr-3 text-white font-medium">{calc.participantName}</td>
                      <td className="py-2 px-2 text-center font-numbers text-text-secondary">
                        {calc.previousRating}
                      </td>
                      <td className="py-2 px-2 text-center font-numbers text-[11px] text-text-secondary">
                        +{calc.breakdown.baseChange} / {calc.breakdown.expectationDelta >= 0 ? '+' : ''}
                        {calc.breakdown.expectationDelta}
                      </td>
                      <td className="py-2 px-2 text-center font-numbers text-[11px] text-text-secondary">
                        +{calc.breakdown.upsetBonus} / +{calc.breakdown.consistencyBonus}
                      </td>
                      <td
                        className={`py-2 px-2 text-center font-numbers font-bold ${
                          calc.ratingChange >= 0 ? 'text-success' : 'text-rose-400'
                        }`}
                      >
                        {calc.ratingChange >= 0 ? `+${calc.ratingChange}` : calc.ratingChange}
                      </td>
                      <td className="py-2 px-2 text-center font-numbers text-neon-cyan font-bold">
                        {calc.newRating}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`text-[10px] font-heading font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                        >
                          {calc.newTier}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-numbers font-bold text-gold">
                        +{calc.leaguePoints}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={submitting || !selected}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-50"
          >
            <Shield size={16} />
            {submitting ? 'Publishing Calculations…' : `Publish CWCL Ratings for ${previewCalculations.length} Participants`}
          </button>
        </div>
      )}
    </div>
  );
}
