import { useState } from 'react';
import { CheckCircle, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

// ─── Exact schedule from Schedule.tsx ────────────────────────────────────────
type Mode = 'Online' | 'Offline' | 'Bonus';

const RAW: [number, number, number, Mode][] = [
  [2026, 7, 1, 'Online'],  [2026, 7, 8, 'Offline'], [2026, 7, 15, 'Online'],
  [2026, 7, 22, 'Offline'],[2026, 7, 29, 'Bonus'],
  [2026, 8, 5, 'Online'],  [2026, 8, 12, 'Offline'],[2026, 8, 19, 'Online'],
  [2026, 8, 26, 'Offline'],
  [2026, 9, 3, 'Online'],  [2026, 9, 10, 'Offline'],[2026, 9, 17, 'Online'],
  [2026, 9, 24, 'Offline'],[2026, 9, 31, 'Bonus'],
  [2026, 10, 7, 'Online'], [2026, 10, 14,'Offline'],[2026, 10, 21,'Online'],
  [2026, 10, 28,'Offline'],
  [2026, 11, 5, 'Online'], [2026, 11, 12,'Offline'],[2026, 11, 19,'Online'],
  [2026, 11, 26,'Offline'],
  [2027, 0, 2, 'Online'],  [2027, 0, 9, 'Offline'], [2027, 0, 16, 'Online'],
  [2027, 0, 23,'Offline'], [2027, 0, 30,'Bonus'],
  [2027, 1, 6, 'Online'],  [2027, 1, 13,'Offline'], [2027, 1, 20, 'Online'],
  [2027, 1, 27,'Offline'],
  [2027, 2, 6, 'Online'],  [2027, 2, 13,'Offline'], [2027, 2, 20, 'Online'],
  [2027, 2, 27,'Offline'],
  [2027, 3, 3, 'Online'],  [2027, 3, 10,'Offline'], [2027, 3, 17, 'Online'],
  [2027, 3, 24,'Offline'],
  [2027, 4, 1, 'Online'],  [2027, 4, 8, 'Offline'], [2027, 4, 15, 'Online'],
  [2027, 4, 22,'Offline'], [2027, 4, 29,'Bonus'],
  [2027, 5, 5, 'Online'],  [2027, 5, 12,'Offline'], [2027, 5, 19, 'Online'],
  [2027, 5, 26,'Offline'],
  [2027, 6, 3, 'Online'],  [2027, 6, 10,'Offline'], [2027, 6, 17, 'Online'],
  [2027, 6, 24,'Offline'], [2027, 6, 31,'Bonus'],
  [2027, 7, 7, 'Online'],  [2027, 7, 14,'Offline'], [2027, 7, 21, 'Online'],
  [2027, 7, 28,'Offline'],
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getStatus(y: number, m: number, d: number): 'Upcoming' | 'Active' | 'Completed' {
  const now = new Date();
  // Compare just dates — if contest date is today or future, it's Upcoming
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cDate = new Date(y, m, d);
  if (cDate > today) return 'Upcoming';
  if (cDate.getTime() === today.getTime()) {
    // Today — check time
    const hour = now.getHours();
    if (hour < 10) return 'Upcoming';
    if (hour < 12) return 'Active';
  }
  return 'Completed';
}

function buildContests() {
  return RAW.map(([y, m, d, mode], idx) => {
    const num = idx + 1;
    const dateStr = toDateStr(y, m, d);
    const monthName = new Date(y, m, 1).toLocaleString('en-US', { month: 'long' });
    const name = mode === 'Bonus'
      ? `CWCL Bonus Challenge #${num} — ${monthName} ${y}`
      : `CWCL Contest #${num} — ${monthName} ${y}`;

    return {
      contestNumber: num,
      weekNumber:    num,
      name,
      mode:          mode === 'Bonus' ? 'Online' : mode, // Bonus treated as Online for mode field
      contestType:   mode,                               // Bonus | Online | Offline
      date:          dateStr,
      startTime:     '10:00',
      endTime:       '12:00',
      duration:      120,
      platform:      mode === 'Offline' ? 'BVRIT Campus' : 'TBA',
      contestLink:   null,
      venue:         mode === 'Offline' ? 'BVRIT, Narsapur' : null,
      problemSetter: null,
      instructions:  null,
      status:        getStatus(y, m, d),
      seasonId:      'cwcl-2026-27',
      createdAt:     new Date().toISOString(),
    };
  });
}

export default function SeedContests() {
  const [status,  setStatus]  = useState<'idle' | 'checking' | 'seeding' | 'deleting' | 'done' | 'error'>('idle');
  const [existing, setExisting] = useState(0);
  const [message,  setMessage]  = useState('');

  async function checkExisting() {
    setStatus('checking');
    const { count } = await supabase.from('contests').select('id', { count: 'exact', head: true });
    setExisting(count ?? 0);
    setStatus('idle');
    if ((count ?? 0) > 0) {
      setMessage(`⚠️ Supabase already has ${count} contest docs. Seeding again will create duplicates.`);
    } else {
      setMessage('✅ No contests in Supabase. Ready to seed 57 contests.');
    }
  }

  async function handleDeleteAll() {
    if (!confirm(`Delete all ${existing} contests from Supabase? This cannot be undone.`)) return;
    setStatus('deleting' as any);
    try {
      await supabase.from('contests').delete().neq('id', '');
      setExisting(0);
      setStatus('idle');
      setMessage(`✅ Deleted all contests. Ready to re-seed.`);
      toast.success('All contests deleted');
    } catch (e: any) {
      setStatus('error');
      setMessage(`❌ Delete failed: ${e.message}`);
    }
  }

  async function handleSeed(overwrite = false) {
    setStatus('seeding');
    try {
      if (overwrite) {
        await supabase.from('contests').delete().neq('id', '');
      }
      const contests = buildContests();
      const rows = contests.map(c => ({
        contest_number: c.contestNumber, name: c.name, week_number: c.weekNumber,
        mode: c.mode, date: c.date, start_time: c.startTime, end_time: c.endTime,
        duration: c.duration, platform: c.platform, contest_link: c.contestLink,
        venue: c.venue, problem_setter: c.problemSetter, instructions: c.instructions,
        status: c.status, season_id: c.seasonId, created_at: c.createdAt,
      }));
      // Insert in chunks of 100
      for (let i = 0; i < rows.length; i += 100) {
        await supabase.from('contests').insert(rows.slice(i, i + 100));
      }
      setStatus('done');
      setMessage(`✅ Successfully seeded ${contests.length} contests to Supabase!`);
      toast.success(`${contests.length} contests seeded!`);
    } catch (e: any) {
      setStatus('error');
      setMessage(`❌ Error: ${e.message}`);
      toast.error(e.message);
    }
  }

  const contests = buildContests();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="heading-md">Seed Contest Schedule</h1>
        <p className="text-text-secondary text-xs mt-1">
          One-time operation to push all 57 CWCL 2026–27 contests to Firestore.
          After this, the schedule is live and real-time across all dashboards.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <div className="stat-number text-2xl text-neon-cyan">{contests.length}</div>
          <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1">Total Contests</div>
        </div>
        <div className="card text-center py-4">
          <div className="stat-number text-2xl text-success">{contests.filter(c => c.status === 'Completed').length}</div>
          <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1">Completed</div>
        </div>
        <div className="card text-center py-4">
          <div className="stat-number text-2xl text-warning">{contests.filter(c => c.status === 'Upcoming').length}</div>
          <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1">Upcoming</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${
          message.startsWith('✅')
            ? 'bg-success/5 border-success/20 text-success'
            : message.startsWith('⚠️')
            ? 'bg-warning/5 border-warning/20 text-warning'
            : 'bg-red-500/5 border-red-500/20 text-red-400'
        }`}>
          {message.startsWith('✅') && <CheckCircle size={16} className="shrink-0 mt-0.5" />}
          {message.startsWith('⚠️') && <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
          <span>{message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="card space-y-4">
        <h2 className="font-heading text-sm font-bold text-neon-cyan">Actions</h2>

        <button onClick={checkExisting} disabled={status === 'checking' || status === 'seeding'}
          className="btn-secondary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {status === 'checking' ? 'Checking…' : 'Check Existing Contests in Firestore'}
        </button>

        {existing === 0 && (
          <button onClick={() => handleSeed(false)} disabled={status === 'seeding' || status === 'done'}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Upload size={15} />
            {status === 'seeding' ? 'Seeding…' : status === 'done' ? 'Done ✓' : 'Seed 57 Contests to Firestore'}
          </button>
        )}

        {existing > 0 && status !== 'done' && (
          <div className="space-y-3">
            <button onClick={handleDeleteAll} disabled={status === 'seeding' || status === 'deleting' as any}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-heading font-bold
                         bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
              <Trash2 size={15} />
              {(status as any) === 'deleting' ? 'Deleting…' : `Delete All ${existing} Contests`}
            </button>
            <button onClick={() => handleSeed(true)} disabled={status === 'seeding'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-heading font-bold
                         bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50">
              <Upload size={15} />
              {status === 'seeding' ? 'Replacing…' : `Delete ${existing} existing + Re-seed 57 fresh`}
            </button>
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center justify-center gap-2 py-3 text-success text-sm font-heading font-bold">
            <CheckCircle size={16} /> Firestore seeded! Real-time listeners will update all dashboards now.
          </div>
        )}
      </div>

      {/* Preview table */}
      <div className="card space-y-3">
        <h2 className="font-heading text-sm font-bold text-neon-cyan">Preview (first 10)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body">
            <thead>
              <tr className="border-b border-neon-cyan/10 text-text-secondary/60 text-[10px] uppercase">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contests.slice(0, 10).map(c => (
                <tr key={c.contestNumber} className="hover:bg-white/5">
                  <td className="py-2 px-2 font-numbers text-neon-cyan">#{c.contestNumber}</td>
                  <td className="py-2 px-2 text-white">{c.name}</td>
                  <td className="py-2 px-2 text-text-secondary">{c.date}</td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      c.contestType === 'Bonus' ? 'bg-yellow-500/10 text-yellow-400' :
                      c.contestType === 'Online' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-neon-cyan/10 text-neon-cyan'
                    }`}>{c.contestType}</span>
                  </td>
                  <td className="py-2 px-2 text-text-secondary/60">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
