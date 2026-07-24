import { useEffect, useState } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Settings, Save, Crown, Users, Calendar, AlertTriangle, Sparkles, RotateCcw } from 'lucide-react';
import { syncFoundingCounter } from '../../lib/foundingMembers';
import toast from 'react-hot-toast';

interface FoundingSettings {
  enabled: boolean;
  maxFoundingMembers: number;
  cutOffDate: string;
  seasonId: string;
  seasonLabel: string;
}

const DEFAULTS: FoundingSettings = {
  enabled: false,
  maxFoundingMembers: 20,
  cutOffDate: '',
  seasonId: '2026-27',
  seasonLabel: '2026–27',
};

export default function FoundingMemberSettings() {
  const [settings, setSettings] = useState<FoundingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState(0);
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    async function load() {
      const [settingsSnap, countSnap] = await Promise.all([
        getDoc(doc(db, 'settings', 'foundingMembers')),
        getDocs(query(collection(db, 'participants'), where('foundingMember', '==', true))),
      ]);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as Partial<FoundingSettings>;
        setSettings({
          enabled: data.enabled ?? DEFAULTS.enabled,
          maxFoundingMembers: data.maxFoundingMembers ?? DEFAULTS.maxFoundingMembers,
          cutOffDate: data.cutOffDate ?? DEFAULTS.cutOffDate,
          seasonId: data.seasonId ?? DEFAULTS.seasonId,
          seasonLabel: data.seasonLabel ?? DEFAULTS.seasonLabel,
        });
      }
      setCount(countSnap.size);
      setLoading(false);
    }
    load();
  }, []);

  function set<K extends keyof FoundingSettings>(key: K, value: FoundingSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'foundingMembers'), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Founding Member settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  }

  async function handleBackfill() {
    if (!settings.enabled) {
      toast.error('Enable Founding Member recognition first');
      return;
    }
    const remaining = settings.maxFoundingMembers - count;
    if (remaining <= 0) {
      toast.error('All founding member slots are already filled');
      return;
    }
    if (!confirm(`Assign founding member status to the first ${remaining} eligible existing participants?`)) return;

    setBackfilling(true);
    try {
      const cutOff = settings.cutOffDate ? new Date(settings.cutOffDate) : null;
      // Use a single-field orderBy on createdAt so no composite index is required.
      // Admin/super-admin accounts and already-awarded participants are filtered client-side.
      const q = query(
        collection(db, 'participants'),
        orderBy('createdAt', 'asc'),
        limit(Math.max(500, remaining + count + 100))
      );
      const snap = await getDocs(q);
      const eligible = snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as any))
        .filter((p: any) => p.role !== 'admin' && p.role !== 'super_admin')
        .filter((p: any) => !p.foundingMember)
        .filter((p: any) => {
          if (!cutOff || !p.createdAt) return true;
          const created = new Date(p.createdAt);
          return created <= cutOff;
        })
        .slice(0, remaining);

      if (eligible.length === 0) {
        toast('No eligible participants found for backfill');
        setBackfilling(false);
        return;
      }

      // Re-count current founding members right before writing so ranks are always sequential.
      const currentCountSnap = await getDocs(
        query(collection(db, 'participants'), where('foundingMember', '==', true))
      );
      const currentCount = currentCountSnap.size;

      const batch = writeBatch(db);
      eligible.forEach((p: any, idx: number) => {
        const ref = doc(db, 'participants', p.uid);
        const hasBadge = (p.badges || []).some((b: any) => b.type === 'founding_member');
        const awardedAt = new Date().toISOString();
        batch.update(ref, {
          foundingMember: true,
          foundingRank: currentCount + idx + 1,
          foundingAwardedAt: awardedAt,
          foundingSeasonId: settings.seasonId,
          badges: hasBadge
            ? p.badges
            : [
                ...(p.badges || []),
                {
                  type: 'founding_member',
                  label: 'Founding Member',
                  emoji: '🏅',
                  awardedAt,
                },
              ],
        });
      });
      await batch.commit();

      // Keep the atomic counter in sync with the real count.
      await syncFoundingCounter();

      const newCountSnap = await getDocs(
        query(collection(db, 'participants'), where('foundingMember', '==', true))
      );
      setCount(newCountSnap.size);
      toast.success(`Backfilled ${eligible.length} founding member(s)`);
    } catch (e: any) {
      toast.error(e.message || 'Backfill failed');
    }
    setBackfilling(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
      </div>
    );
  }

  const remaining = Math.max(0, settings.maxFoundingMembers - count);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md flex items-center gap-2">
          <Crown className="text-gold" size={24} />
          Founding Members
        </h1>
        <p className="text-text-secondary text-xs mt-1">
          Configure recognition for the earliest registered participants of the inaugural season.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 space-y-1">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1">
            <Users size={11} /> Claimed Slots
          </div>
          <div className="stat-number text-2xl text-gold">
            {count} <span className="text-text-secondary/50 text-base">/ {settings.maxFoundingMembers}</span>
          </div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} /> Remaining
          </div>
          <div className={`stat-number text-2xl ${remaining === 0 ? 'text-text-secondary' : 'text-neon-cyan'}`}>
            {remaining}
          </div>
        </div>
        <div className="card p-4 space-y-1">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider flex items-center gap-1">
            <Settings size={11} /> Status
          </div>
          <div className={`stat-number text-2xl ${settings.enabled ? 'text-success' : 'text-text-secondary'}`}>
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Settings form */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neon-cyan/10">
          <Settings size={14} className="text-neon-cyan" />
          <h2 className="font-heading text-sm font-bold text-neon-cyan">Recognition Settings</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-white text-xs font-medium">Enable Founding Member Recognition</label>
            <p className="text-text-secondary/60 text-[10px]">Automatically assign founding status during registration.</p>
          </div>
          <button
            onClick={() => set('enabled', !settings.enabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-success' : 'bg-white/10'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Maximum Founding Members</label>
            <input
              type="number"
              min={1}
              className="input-field text-xs"
              value={settings.maxFoundingMembers}
              onChange={e => set('maxFoundingMembers', Math.max(1, parseInt(e.target.value) || 0))}
            />
          </div>
          <div>
            <label className="input-label flex items-center gap-1">
              <Calendar size={10} /> Cut-off Date (Optional)
            </label>
            <input
              type="date"
              className="input-field text-xs"
              value={settings.cutOffDate ? settings.cutOffDate.slice(0, 10) : ''}
              onChange={e => set('cutOffDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
            />
            <p className="text-text-secondary/50 text-[10px] mt-1">Registrations after this date are not eligible.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Season ID</label>
            <input
              type="text"
              className="input-field text-xs"
              value={settings.seasonId}
              onChange={e => set('seasonId', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Season Label</label>
            <input
              type="text"
              className="input-field text-xs"
              value={settings.seasonLabel}
              onChange={e => set('seasonLabel', e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={13} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Backfill */}
      <div className="card space-y-4 border-gold/20">
        <div className="flex items-center gap-2 pb-3 border-b border-gold/10">
          <RotateCcw size={14} className="text-gold" />
          <h2 className="font-heading text-sm font-bold text-gold">Backfill Existing Registrations</h2>
        </div>
        <p className="text-text-secondary text-xs leading-relaxed">
          If participants registered before this feature was enabled, you can retroactively assign founding member status
          to the earliest eligible registrants based on registration order and the cut-off date.
        </p>
        <div className="flex items-center gap-3 bg-gold/5 border border-gold/10 rounded-lg p-3">
          <AlertTriangle size={16} className="text-gold shrink-0" />
          <p className="text-text-secondary text-[11px]">
            This action is permanent. Once assigned, founding member status cannot be undone.
          </p>
        </div>
        <button
          onClick={handleBackfill}
          disabled={backfilling || !settings.enabled || remaining === 0}
          className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 disabled:opacity-50 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
        >
          <Sparkles size={13} />
          {backfilling ? 'Backfilling…' : `Backfill Up to ${remaining} Slots`}
        </button>
      </div>
    </div>
  );
}
