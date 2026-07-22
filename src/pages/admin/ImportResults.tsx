import React, { useEffect, useState, useRef } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, writeBatch, getDocs, getDoc, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Contest } from '../../types';
import { LEAGUE_POINTS_TABLE, PARTICIPATION_POINTS, getTierFromRating } from '../../types';
import { evaluateAndAwardBadges } from '../../lib/badges';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rankIdx    = headers.findIndex(h => h.includes('rank'));
  const nameIdx    = headers.findIndex(h => h.includes('name') || h.includes('handle'));
  const scoreIdx   = headers.findIndex(h => h.includes('score') || h.includes('point'));
  const penaltyIdx = headers.findIndex(h => h.includes('penalty'));
  if (rankIdx < 0 || nameIdx < 0 || scoreIdx < 0 || penaltyIdx < 0) return [];
  return lines.slice(1).filter(l => l.trim()).map(l => {
    const cols = l.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    return {
      rank:    parseInt(cols[rankIdx])      || 0,
      name:    cols[nameIdx]                || '',
      score:   parseFloat(cols[scoreIdx])   || 0,
      penalty: parseFloat(cols[penaltyIdx]) || 0,
      solved:  0,
    };
  }).filter(r => r.rank > 0);
}

// Simple Elo-style rating delta based on rank and field size
function calcRatingDelta(rank: number, totalParticipants: number): number {
  if (rank === 1)  return 50;
  if (rank <= 3)   return 30;
  if (rank <= 10)  return 15;
  if (rank <= Math.ceil(totalParticipants * 0.25)) return 8;
  if (rank <= Math.ceil(totalParticipants * 0.5))  return 3;
  if (rank <= Math.ceil(totalParticipants * 0.75)) return -5;
  return -10;
}

export default function ImportResults() {
  const [contests,   setContests]   = useState<Contest[]>([]);
  const [selected,   setSelected]   = useState('');
  const [rows,       setRows]       = useState<ParsedRow[]>([]);
  const [fileName,   setFileName]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'contests'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setContests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contest)));
    });
    return () => unsub();
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('Could not parse file. Ensure it has Rank, Name, Score, Penalty columns.');
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!selected)        { toast.error('Select a contest first'); return; }
    if (rows.length === 0) { toast.error('No data to import');      return; }
    setSubmitting(true);

    try {
      const contest = contests.find(c => c.id === selected)!;

      // ── 1. Fetch all participants to match names ──────────────────────────
      const partSnap  = await getDocs(collection(db, 'participants'));
      const allParts  = partSnap.docs.map(d => ({ docId: d.id, ...d.data() } as any));

      // Fetch total COMPLETED contests count for accurate attendance calc
      const contestsSnap = await getDocs(collection(db, 'contests'));
      const completedContests = contestsSnap.docs.filter(d => d.data().status === 'Completed').length;
      // +1 because this contest is being marked Completed in this same batch
      const totalContests = completedContests + 1;

      const totalParticipants = rows.length;
      const batch = writeBatch(db);

      const matchedUids: string[] = [];

      for (const row of rows) {
        // Match participant by full name, CF handle, or participantId
        const match = allParts.find((p: any) =>
          p.fullName?.toLowerCase()         === row.name.toLowerCase() ||
          p.codeforcesHandle?.toLowerCase() === row.name.toLowerCase() ||
          p.hackerrankUsername?.toLowerCase()=== row.name.toLowerCase() ||
          p.participantId?.toLowerCase()    === row.name.toLowerCase()
        );

        const lp          = LEAGUE_POINTS_TABLE[row.rank] ?? PARTICIPATION_POINTS;
        const ratingBefore = match?.rating ?? 800;
        const delta        = calcRatingDelta(row.rank, totalParticipants);
        const ratingAfter  = Math.max(800, ratingBefore + delta);
        const newTier      = getTierFromRating(ratingAfter);

        // ── Write contest result ──
        const resultRef = doc(collection(db, 'contestResults'));
        batch.set(resultRef, {
          contestId:       selected,
          contestName:     contest.name,
          participantId:   match?.participantId ?? null,
          participantName: row.name,
          college:         match?.college ?? 'Unknown',
          rank:            row.rank,
          score:           row.score,
          penalty:         row.penalty,
          problemsSolved:  row.solved ?? 0,
          leaguePoints:    lp,
          ratingBefore,
          ratingAfter,
          importedAt:      serverTimestamp(),
        });

        // ── Update participant stats (only for matched participants) ──
        if (match?.docId) {
          matchedUids.push(match.docId);

          // Re-fetch to get latest contestsParticipated for accurate attendance
          const partDocRef  = doc(db, 'participants', match.docId);
          const partDocSnap = await getDoc(partDocRef);
          const partData    = partDocSnap.data() as any;
          const newContestsCount = (partData?.contestsParticipated ?? 0) + 1;
          const newAttendance    = Math.min(100, Math.round((newContestsCount / totalContests) * 100));

          batch.update(partDocRef, {
            rating:               ratingAfter,
            tier:                 newTier,
            contestsParticipated: increment(1),
            attendance:           newAttendance,
          });
        }
      }

      // ── Mark contest as Completed ──
      batch.update(doc(db, 'contests', selected), { status: 'Completed' });

      await batch.commit();
      toast.success(`✅ Imported ${rows.length} results for ${contest.name}!`);

      // ── 2. Evaluate badges for all matched participants ──────────────────
      let badgeCount = 0;
      for (const uid of matchedUids) {
        try {
          const awarded = await evaluateAndAwardBadges(uid);
          badgeCount += awarded.length;
        } catch { /**/ }
      }

      if (badgeCount > 0) {
        toast.success(
          `🎖️ Awarded ${badgeCount} new badge${badgeCount !== 1 ? 's' : ''}!`,
          { duration: 4000 }
        );
      }

      setRows([]);
      setFileName('');
      setSelected('');
      if (fileRef.current) fileRef.current.value = '';

    } catch (e: any) {
      toast.error(e.message ?? 'Import failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md">Import Results</h1>
        <p className="text-text-secondary text-xs mt-1">Upload a CSV with contest results. Participant stats update automatically.</p>
      </div>

      {/* Select Contest */}
      <div className="card space-y-4">
        <h2 className="heading-sm">1. Select Contest</h2>
        <select className="input-field" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">-- Select a contest --</option>
          {contests.map(c => <option key={c.id} value={c.id}>{c.name} · {c.date}</option>)}
        </select>
      </div>

      {/* Upload CSV */}
      <div className="card space-y-4">
        <h2 className="heading-sm">2. Upload CSV / Excel</h2>
        <div className="flex items-center gap-3 bg-warning/5 border border-warning/20 rounded-lg px-4 py-3">
          <AlertCircle size={14} className="text-warning shrink-0" />
          <p className="text-warning/80 text-xs">Required columns: <strong>Rank, Name, Score, Penalty</strong> (case-insensitive headers)</p>
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
              <p className="text-text-secondary text-sm">Click to upload or drag & drop</p>
              <p className="text-text-secondary/60 text-xs mt-1">CSV, XLS, XLSX supported</p>
            </>
          )}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-success" />
            <h2 className="heading-sm">3. Preview ({rows.length} rows)</h2>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs font-body">
              <thead className="sticky top-0 bg-card-dark">
                <tr className="text-text-secondary/70 border-b border-neon-cyan/10">
                  <th className="text-left py-2 pr-4 text-[10px] uppercase">Rank</th>
                  <th className="text-left py-2 pr-4 text-[10px] uppercase">Name</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">Score</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">Penalty</th>
                  <th className="text-center py-2 px-2 text-[10px] uppercase">LP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-cyan/5">
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 font-numbers text-text-secondary">#{r.rank}</td>
                    <td className="py-2 pr-4 text-white">{r.name}</td>
                    <td className="py-2 px-2 text-center font-numbers">{r.score}</td>
                    <td className="py-2 px-2 text-center font-numbers text-text-secondary">{r.penalty}</td>
                    <td className="py-2 px-2 text-center font-numbers text-neon-cyan">
                      {LEAGUE_POINTS_TABLE[r.rank] ?? PARTICIPATION_POINTS}
                    </td>
                  </tr>
                ))}
                {rows.length > 20 && (
                  <tr><td colSpan={5} className="py-2 text-center text-text-secondary text-[10px]">
                    … and {rows.length - 20} more rows
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} disabled={submitting || !selected}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            <Upload size={14} />
            {submitting ? 'Importing…' : `Import ${rows.length} Results`}
          </button>
        </div>
      )}
    </div>
  );
}
