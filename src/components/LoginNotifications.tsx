import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, FileText, X, Sparkles, Crown, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Badge } from '../types';
import { BADGE_META } from '../types';
import { getCertificatesByParticipant, getAnnouncements } from '../lib/db';

interface NotificationItem {
  id: string;
  type: 'badge' | 'certificate' | 'founding' | 'announcement';
  title: string;
  subtitle: string;
  awardedAt: string;
  icon: React.ReactNode;
  link: string;
}

const STORAGE_KEY = 'cwcl_lastNotificationCheck';

function parseDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (value.seconds) {
    return new Date(value.seconds * 1000);
  }
  return null;
}

export default function LoginNotifications() {
  const { participant, loading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading || !participant) return;
    if (checked) return;
    const p = participant;

    // Use localStorage so the timestamp persists across browser sessions.
    // Fall back to 24 hours ago on first visit — avoids flooding with old items.
    const stored = localStorage.getItem(STORAGE_KEY);
    const lastCheck = stored
      ? new Date(stored)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    async function load() {
      const notifications: NotificationItem[] = [];

      // ── Badges ──
      (p.badges || []).forEach((badge: Badge) => {
        const awardedAt = parseDate(badge.awardedAt);
        if (!awardedAt || awardedAt <= lastCheck) return;

        const meta = BADGE_META[badge.type];
        notifications.push({
          id: `badge-${badge.type}-${badge.awardedAt}`,
          type: badge.type === 'founding_member' ? 'founding' : 'badge',
          title: badge.label || meta?.label || 'New Badge',
          subtitle: badge.type === 'founding_member'
            ? 'You are now a Founding Member'
            : 'New badge earned',
          awardedAt: badge.awardedAt,
          icon: badge.type === 'founding_member'
            ? <Crown size={18} className="text-gold" />
            : <Award size={18} className="text-gold" />,
          link: '/dashboard/profile',
        });
      });

      // ── Founding member (if not already captured as a badge) ──
      if (
        p.foundingMember === true &&
        p.foundingAwardedAt &&
        !notifications.some(n => n.type === 'founding')
      ) {
        const awardedAt = parseDate(p.foundingAwardedAt);
        if (awardedAt && awardedAt > lastCheck) {
          notifications.push({
            id: `founding-${p.foundingAwardedAt}`,
            type: 'founding',
            title: 'Founding Member',
            subtitle: `Rank #${p.foundingRank} of the inaugural season`,
            awardedAt: p.foundingAwardedAt,
            icon: <Crown size={18} className="text-gold" />,
            link: '/dashboard/profile',
          });
        }
      }

      // ── Certificates ──
      try {
        const certs = await getCertificatesByParticipant(p.participantId);
        certs.forEach((cert) => {
          if (cert.status === 'Pending') return;
          const issuedAt = parseDate(cert.issuedDate || (cert as any).issuedAt || cert.createdAt);
          if (!issuedAt || issuedAt <= lastCheck) return;
          notifications.push({
            id: `cert-${cert.id}`,
            type: 'certificate',
            title: `${cert.certificateType || (cert as any).type || 'Certificate'} Awarded`,
            subtitle: cert.contestName || cert.season || 'Official CWCL certificate',
            awardedAt: cert.issuedDate || (cert as any).issuedAt || cert.createdAt || '',
            icon: <FileText size={18} className="text-neon-cyan" />,
            link: '/dashboard/certificates',
          });
        });
      } catch { /* ignore */ }

      // ── Announcements ──
      try {
        const ann = await getAnnouncements(20);
        ann.forEach((a) => {
          const postedAt = parseDate(a.createdAt);
          if (!postedAt || postedAt <= lastCheck) return;
          notifications.push({
            id: `ann-${a.id}`,
            type: 'announcement',
            title: a.title,
            subtitle: a.category,
            awardedAt: a.createdAt,
            icon: <Megaphone size={18} className="text-warning" />,
            link: '/dashboard/announcements',
          });
        });
      } catch { /* ignore */ }

      // Sort newest first.
      notifications.sort((a, b) => {
        const da = parseDate(a.awardedAt);
        const db_ = parseDate(b.awardedAt);
        if (!da || !db_) return 0;
        return db_.getTime() - da.getTime();
      });

      if (notifications.length > 0) {
        setItems(notifications);
        setOpen(true);
      }
      setChecked(true);
    }

    load();
  }, [participant, loading, checked]);

  function handleClose() {
    setOpen(false);
    // Save the current time so this batch won't show again
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }

  const grouped = useMemo(() => {
    return {
      badges: items.filter(i => i.type === 'badge' || i.type === 'founding'),
      certificates: items.filter(i => i.type === 'certificate'),
      announcements: items.filter(i => i.type === 'announcement'),
    };
  }, [items]);

  if (!open || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-midnight/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}>
      <div className="bg-[#0a1628] border border-neon-cyan/25 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              <Sparkles size={15} className="text-neon-cyan" />
            </div>
            <div>
              <h2 className="heading-sm text-sm">What's New</h2>
              <p className="text-text-secondary text-[10px]">Since your last visit</p>
            </div>
          </div>
          <button onClick={handleClose}
            className="text-text-secondary hover:text-white p-1 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[50vh] space-y-5">
          {grouped.badges.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-text-secondary/70 mb-2">Badges & Recognition</h3>
              <div className="space-y-2">
                {grouped.badges.map(item => (
                  <Link key={item.id} to={item.link} onClick={handleClose}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-cyan/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-midnight border border-white/10 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{item.title}</div>
                      <div className="text-text-secondary/60 text-[10px] truncate">{item.subtitle}</div>
                    </div>
                    <ChevronRightMini />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {grouped.certificates.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-text-secondary/70 mb-2">Certificates</h3>
              <div className="space-y-2">
                {grouped.certificates.map(item => (
                  <Link key={item.id} to={item.link} onClick={handleClose}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-cyan/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-midnight border border-white/10 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{item.title}</div>
                      <div className="text-text-secondary/60 text-[10px] truncate">{item.subtitle}</div>
                    </div>
                    <ChevronRightMini />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {grouped.announcements.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-text-secondary/70 mb-2">New Announcements</h3>
              <div className="space-y-2">
                {grouped.announcements.map(item => (
                  <Link key={item.id} to={item.link} onClick={handleClose}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-warning/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-midnight border border-white/10 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{item.title}</div>
                      <div className="text-text-secondary/60 text-[10px] truncate">{item.subtitle}</div>
                    </div>
                    <ChevronRightMini />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02]">
          <button onClick={() => {
            handleClose();
          }} className="btn-primary w-full text-xs">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronRightMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="text-text-secondary/40 shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
