import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Settings, Save, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface CommunityData {
  announcementWhatsapp: string;
  discussionWhatsapp: string;
  discord: string;
}

interface SocialData {
  instagram: string;
  linkedin: string;
  twitter: string;
  website: string;
}

const EMPTY_COMMUNITY: CommunityData = {
  announcementWhatsapp: '',
  discussionWhatsapp: '',
  discord: '',
};

const EMPTY_SOCIAL: SocialData = {
  instagram: '',
  linkedin: '',
  twitter: '',
  website: '',
};

export default function CommunitySettings() {
  const [community, setCommunity] = useState<CommunityData>(EMPTY_COMMUNITY);
  const [social, setSocial] = useState<SocialData>(EMPTY_SOCIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [commSnap, socialSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'community')),
          getDoc(doc(db, 'settings', 'social')),
        ]);
        if (commSnap.exists()) {
          const d = commSnap.data();
          setCommunity({
            announcementWhatsapp: d.announcementWhatsapp ?? '',
            discussionWhatsapp: d.discussionWhatsapp ?? '',
            discord: d.discord ?? '',
          });
        }
        if (socialSnap.exists()) {
          const d = socialSnap.data();
          setSocial({
            instagram: d.instagram ?? '',
            linkedin: d.linkedin ?? '',
            twitter: d.twitter ?? '',
            website: d.website ?? '',
          });
        }
      } catch (e: any) {
        toast.error('Failed to load settings');
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        setDoc(doc(db, 'settings', 'community'), community),
        setDoc(doc(db, 'settings', 'social'), social),
      ]);
      toast.success('Community settings saved!');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save');
    }
    setSaving(false);
  }

  function setCommunityField(field: keyof CommunityData, value: string) {
    setCommunity(prev => ({ ...prev, [field]: value }));
  }

  function setSocialField(field: keyof SocialData, value: string) {
    setSocial(prev => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center">
            <Settings size={18} className="text-electric-blue" />
          </div>
          <div>
            <h1 className="heading-md">Community Settings</h1>
            <p className="text-text-secondary text-xs mt-0.5">Manage community links and social media. Changes are live instantly.</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Links */}
      <div className="card">
        <h2 className="font-heading text-white text-sm font-bold mb-5 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-neon-cyan" />
          WhatsApp Communities
        </h2>
        <div className="space-y-5">
          <div>
            <label className="input-label">Announcement WhatsApp Link</label>
            <input
              className="input-field"
              placeholder="https://chat.whatsapp.com/xxxxxxxx"
              value={community.announcementWhatsapp}
              onChange={e => setCommunityField('announcementWhatsapp', e.target.value)}
            />
            <p className="text-[10px] text-text-secondary/60 mt-1.5">
              Official announcements channel — only admins can send messages.
            </p>
            {community.announcementWhatsapp && (
              <a href={community.announcementWhatsapp} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline mt-1">
                Test Link <ExternalLink size={10} />
              </a>
            )}
          </div>
          <div>
            <label className="input-label">Discussion WhatsApp Link</label>
            <input
              className="input-field"
              placeholder="https://chat.whatsapp.com/xxxxxxxx"
              value={community.discussionWhatsapp}
              onChange={e => setCommunityField('discussionWhatsapp', e.target.value)}
            />
            <p className="text-[10px] text-text-secondary/60 mt-1.5">
              Open discussion group — everyone can participate.
            </p>
            {community.discussionWhatsapp && (
              <a href={community.discussionWhatsapp} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline mt-1">
                Test Link <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Discord */}
      <div className="card">
        <h2 className="font-heading text-white text-sm font-bold mb-5 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-purple-400" />
          Discord
        </h2>
        <div>
          <label className="input-label">Discord Invite Link</label>
          <input
            className="input-field"
            placeholder="https://discord.gg/xxxxxxxx"
            value={community.discord}
            onChange={e => setCommunityField('discord', e.target.value)}
          />
          <p className="text-[10px] text-text-secondary/60 mt-1.5">
            Leave empty to show "Coming Soon" on the Community page.
          </p>
          {community.discord && (
            <a href={community.discord} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline mt-1">
              Test Link <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="card">
        <h2 className="font-heading text-white text-sm font-bold mb-5 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-electric-blue" />
          Social Media Links
        </h2>
        <div className="space-y-5">
          {([
            { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://www.instagram.com/coding_brigade' },
            { key: 'linkedin' as const,  label: 'LinkedIn',  placeholder: 'https://www.linkedin.com/in/coding-brigade-bvrit-402634229/' },
            { key: 'twitter' as const,   label: 'X (Twitter)', placeholder: 'https://x.com/CBB_BVRIT' },
            { key: 'website' as const,   label: 'Website',   placeholder: 'https://www.cbb.bvrit.ac.in/' },
          ]).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="input-label">{label}</label>
              <input
                className="input-field"
                placeholder={placeholder}
                value={social[key]}
                onChange={e => setSocialField(key, e.target.value)}
              />
              {social[key] && (
                <a href={social[key]} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline mt-1">
                  Test Link <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs px-8 py-3 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Settings</>}
        </button>
        <p className="text-[10px] text-text-secondary/60">
          Changes are reflected instantly on the Community page.
        </p>
      </div>

    </div>
  );
}
