import { useEffect, useState } from 'react';
import { Handshake } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Sponsor, SponsorTier } from '../../types';

const TIER_CONFIG: Record<SponsorTier, { label: string; color: string; size: string }> = {
  Gold:   { label: '🥇 Gold Sponsors',   color: '#F4C430', size: 'h-20' },
  Silver: { label: '🥈 Silver Sponsors', color: '#C0C0C0', size: 'h-16' },
  Bronze: { label: '🥉 Bronze Sponsors', color: '#CD7F32', size: 'h-12' },
};

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'sponsors'), where('isActive', '==', true), orderBy('tier'));
        const snap = await getDocs(q);
        setSponsors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sponsor)));
      } catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, []);

  const grouped: Record<SponsorTier, Sponsor[]> = { Gold: [], Silver: [], Bronze: [] };
  sponsors.forEach(s => grouped[s.tier]?.push(s));

  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="heading-lg mb-3">Our Sponsors</h1>
          <p className="text-text-secondary text-sm">CWCL is made possible by these amazing organizations.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
          </div>
        ) : sponsors.length === 0 ? (
          <div className="card text-center py-16">
            <Handshake size={48} className="text-neon-cyan/20 mx-auto mb-4" />
            <h3 className="heading-sm mb-2">Sponsors Coming Soon</h3>
            <p className="text-text-secondary text-sm">Sponsorship information will be listed here.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {(['Gold', 'Silver', 'Bronze'] as SponsorTier[]).map((tier) => {
              if (grouped[tier].length === 0) return null;
              const cfg = TIER_CONFIG[tier];
              return (
                <div key={tier}>
                  <h2 className="text-center font-heading text-sm tracking-widest uppercase mb-6"
                    style={{ color: cfg.color }}>{cfg.label}</h2>
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {grouped[tier].map(s => (
                      <a key={s.id} href={s.websiteURL} target="_blank" rel="noopener noreferrer"
                        className="card hover:border-neon-cyan/40 transition-all p-6 flex items-center justify-center">
                        <img src={s.logoURL} alt={s.name} className={`${cfg.size} object-contain filter brightness-90 hover:brightness-100 transition-all`} />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Become a Sponsor CTA */}
        <div className="card text-center mt-16">
          <Handshake size={32} className="text-neon-cyan mx-auto mb-3" />
          <h3 className="heading-sm mb-2">Become a Sponsor</h3>
          <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">
            Reach 2000+ student developers from 50+ colleges. Contact us to discuss sponsorship opportunities.
          </p>
          <a href="mailto:cbb@bvrit.ac.in" className="btn-primary inline-flex items-center gap-2 text-xs px-6">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
