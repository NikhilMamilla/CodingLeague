import { useEffect, useState } from 'react';
import type { Sponsor, SponsorTier } from '../../types';
import { Handshake, Plus, ToggleLeft, ToggleRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllSponsors, upsertSponsor, updateSponsor } from '../../lib/db';

const TIERS: SponsorTier[] = ['Gold', 'Silver', 'Bronze'];

const TIER_COLOR: Record<SponsorTier, string> = {
  Gold:   'text-gold   border-gold/30',
  Silver: 'text-silver border-silver/30',
  Bronze: 'text-bronze border-bronze/30',
};

const EMPTY = { name: '', tier: 'Gold' as SponsorTier, logoURL: '', websiteURL: '' };

export default function ManageSponsors() {
  const [sponsors,  setSponsors]  = useState<Sponsor[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    getAllSponsors().then(list => { setSponsors(list); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleCreate() {
    if (!form.name || !form.logoURL || !form.websiteURL) { toast.error('Name, logo URL, and website URL are required'); return; }
    setSaving(true);
    try {
      await upsertSponsor({ name: form.name, tier: form.tier, logoURL: form.logoURL, websiteURL: form.websiteURL, isActive: true });
      const list = await getAllSponsors();
      setSponsors(list);
      toast.success('Sponsor added!');
      setForm(EMPTY); setShowForm(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(s: Sponsor) {
    try {
      await updateSponsor(s.id, { isActive: !s.isActive });
      setSponsors(prev => prev.map(sp => sp.id === s.id ? { ...sp, isActive: !s.isActive } : sp));
      toast.success(s.isActive ? 'Sponsor deactivated' : 'Sponsor activated');
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md mb-1">Sponsors</h1>
          <p className="text-text-secondary text-xs">Manage sponsor listings displayed on the platform.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs flex items-center gap-2 px-4">
          <Plus size={14} /> Add Sponsor
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-card-dark border border-neon-cyan/20 rounded-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="heading-sm">Add Sponsor</h2>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Company Name *</label>
                <input className="input-field" placeholder="Acme Corp" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Tier</label>
                <select className="input-field" value={form.tier} onChange={e => set('tier', e.target.value)}>
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Logo URL *</label>
                <input className="input-field" placeholder="https://…/logo.png" value={form.logoURL} onChange={e => set('logoURL', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Website URL *</label>
                <input className="input-field" placeholder="https://acme.com" value={form.websiteURL} onChange={e => set('websiteURL', e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 text-xs disabled:opacity-50">
                  {saving ? 'Adding…' : 'Add Sponsor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : sponsors.length === 0 ? (
        <div className="card text-center py-12">
          <Handshake size={40} className="text-neon-cyan/20 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No sponsors added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {TIERS.map(tier => {
            const group = sponsors.filter(s => s.tier === tier);
            if (group.length === 0) return null;
            return (
              <div key={tier}>
                <h2 className={`font-heading text-xs tracking-widest uppercase mb-2 ${TIER_COLOR[tier].split(' ')[0]}`}>
                  {tier} Sponsors
                </h2>
                <div className="space-y-2">
                  {group.map(s => (
                    <div key={s.id} className={`card flex items-center justify-between gap-4 ${!s.isActive ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <img src={s.logoURL} alt={s.name} className="h-8 w-16 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div>
                          <div className="text-white text-xs font-heading font-bold">{s.name}</div>
                          <a href={s.websiteURL} target="_blank" rel="noopener noreferrer"
                            className="text-text-secondary/60 text-[10px] hover:text-neon-cyan transition-colors truncate max-w-xs block">
                            {s.websiteURL}
                          </a>
                        </div>
                      </div>
                      <button onClick={() => toggleActive(s)}
                        className="text-text-secondary hover:text-neon-cyan transition-colors shrink-0">
                        {s.isActive ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
