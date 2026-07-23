import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import {
  Users, MessageCircle, Megaphone, Globe,
  ExternalLink, ChevronRight, HelpCircle, ChevronDown, ChevronUp,
  Bell, MessageSquare, Radio, Send, CheckCircle2, Clock,
} from 'lucide-react';
import type { Announcement } from '../../types';
import { Link } from 'react-router-dom';

/* ────────────────────────────────────────────────────────────── */
/*  TYPES                                                         */
/* ────────────────────────────────────────────────────────────── */

interface CommunitySettings {
  announcementWhatsapp: string;
  discussionWhatsapp: string;
  discord: string;
}

interface SocialLinks {
  instagram: string;
  linkedin: string;
  twitter: string;
  website: string;
}

/* ────────────────────────────────────────────────────────────── */
/*  ANIMATION VARIANTS                                            */
/* ────────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.58, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
};

/* ────────────────────────────────────────────────────────────── */
/*  COMMUNITY CARD COMPONENT                                      */
/* ────────────────────────────────────────────────────────────── */

function CommunityCard({
  icon: Icon, title, description, benefits, buttonLabel, buttonHref,
  accentColor = 'neon-cyan', disabled = false, index = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  benefits?: string[];
  buttonLabel: string;
  buttonHref?: string;
  accentColor?: string;
  disabled?: boolean;
  index?: number;
}) {
  const colorMap: Record<string, { border: string; bg: string; text: string; glow: string; btn: string }> = {
    'neon-cyan': {
      border: 'border-neon-cyan/30 hover:border-neon-cyan/70',
      bg: 'bg-neon-cyan/5',
      text: 'text-neon-cyan',
      glow: 'hover:shadow-[0_0_30px_rgba(0,229,255,0.18)]',
      btn: 'bg-neon-cyan text-midnight hover:shadow-[0_0_20px_rgba(0,229,255,0.5)]',
    },
    'electric-blue': {
      border: 'border-electric-blue/30 hover:border-electric-blue/70',
      bg: 'bg-electric-blue/5',
      text: 'text-electric-blue',
      glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.18)]',
      btn: 'bg-electric-blue text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    },
    'purple': {
      border: 'border-purple-500/30 hover:border-purple-500/70',
      bg: 'bg-purple-500/5',
      text: 'text-purple-400',
      glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]',
      btn: 'bg-purple-500 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    },
  };
  const c = colorMap[accentColor] ?? colorMap['neon-cyan'];

  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible" custom={index}
      className={`relative bg-card-dark border rounded-2xl p-6 md:p-8 transition-all duration-300 ${c.border} ${c.glow}`}
    >
      {/* Gradient top bar */}
      <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-current to-transparent ${c.text} opacity-40`} />

      {/* Icon + title */}
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
          <Icon size={22} className={c.text} />
        </div>
        <div>
          <h3 className="font-heading text-white text-base md:text-lg font-bold tracking-wide">{title}</h3>
          <p className="text-text-secondary text-xs mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Benefits list */}
      {benefits && benefits.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] text-text-secondary/60 uppercase tracking-widest mb-2.5">What you get</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {benefits.map(b => (
              <div key={b} className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle2 size={12} className={`${c.text} shrink-0`} />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      {disabled ? (
        <div className="flex items-center gap-2 text-text-secondary/50 text-xs font-heading uppercase tracking-widest">
          <Clock size={13} />
          <span>Coming Soon</span>
        </div>
      ) : buttonHref ? (
        <a
          href={buttonHref} target="_blank" rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading font-bold text-xs uppercase tracking-widest transition-all duration-200 active:scale-95 ${c.btn}`}
        >
          <Send size={13} />
          {buttonLabel}
          <ExternalLink size={12} />
        </a>
      ) : (
        <button disabled
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-heading font-bold text-xs uppercase tracking-widest bg-white/5 text-text-secondary/40 cursor-not-allowed"
        >
          <Send size={13} />
          {buttonLabel}
        </button>
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  SOCIAL ICONS (inline SVG wrappers)                             */
/* ────────────────────────────────────────────────────────────── */

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function LinkedinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function XTwitterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.213 5.567 5.95-5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  CBB WEBSITE ICON                                             */
/* ────────────────────────────────────────────────────────────── */

function CBBWebsiteIcon({ size = 18 }: { size?: number }) {
  return (
    <img
      src="/cbb.png"
      alt="CBB Website"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  SOCIAL BUTTON COMPONENT                                       */
/* ────────────────────────────────────────────────────────────── */

function SocialButton({
  icon: Icon, label, action, href, color,
}: {
  icon: React.ElementType;
  label: string;
  action: string;
  href?: string;
  color: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card-dark border border-white/10 hover:border-neon-cyan/40 transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] group"
    >
      <div className="flex items-center gap-3">
        <span style={{ color }} className="shrink-0"><Icon size={18} /></span>
        <div>
          <div className="text-white text-xs font-semibold">{label}</div>
          <div className="text-text-secondary/60 text-[10px]">{action}</div>
        </div>
      </div>
      <ChevronRight size={14} className="text-text-secondary/30 group-hover:text-neon-cyan transition-colors" />
    </a>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  FAQ ITEM                                                      */
/* ────────────────────────────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden transition-all hover:border-neon-cyan/30">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-white text-xs font-semibold">{q}</span>
        {open
          ? <ChevronUp size={14} className="text-neon-cyan shrink-0" />
          : <ChevronDown size={14} className="text-text-secondary/50 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4 text-text-secondary text-xs leading-relaxed border-t border-white/5 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  MAIN COMMUNITY PAGE                                           */
/* ────────────────────────────────────────────────────────────── */

export default function Community() {
  const [community, setCommunity] = useState<CommunitySettings>({
    announcementWhatsapp: '', discussionWhatsapp: '', discord: '',
  });
  const [social, setSocial] = useState<SocialLinks>({
    instagram: '', linkedin: '', twitter: '', website: '',
  });
  const [announcements, setAnnouncements] = useState<(Announcement & { id: string })[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    const unsubComm = onSnapshot(
      doc(db, 'settings', 'community'),
      snap => {
        if (snap.exists()) {
          const d = snap.data();
          setCommunity({
            announcementWhatsapp: d.announcementWhatsapp ?? '',
            discussionWhatsapp: d.discussionWhatsapp ?? '',
            discord: d.discord ?? '',
          });
        }
        setLoadingCommunity(false);
      },
      () => setLoadingCommunity(false)
    );

    const unsubSocial = onSnapshot(
      doc(db, 'settings', 'social'),
      snap => {
        if (snap.exists()) {
          const d = snap.data();
          setSocial({
            instagram: d.instagram ?? '',
            linkedin: d.linkedin ?? '',
            twitter: d.twitter ?? '',
            website: d.website ?? '',
          });
        }
        setLoadingSocial(false);
      },
      () => setLoadingSocial(false)
    );

    // Latest 3 announcements
    (async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
        const snap = await getDocs(q);
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement & { id: string })));
      } catch { /* ignore */ }
      setLoadingAnnouncements(false);
    })();

    return () => { unsubComm(); unsubSocial(); };
  }, []);

  const faqs = [
    {
      q: 'Why should I join the CWCL WhatsApp community?',
      a: 'The WhatsApp community is the fastest way to receive official contest announcements, contest links, result notifications, and certificates. You will never miss an important update.',
    },
    {
      q: 'Will everyone be able to message in the Announcements group?',
      a: 'No. The Official Announcements community is admin-only for sending messages. Participants can only receive and read announcements. This keeps the channel clean and free from spam.',
    },
    {
      q: 'How do I receive contest links?',
      a: 'Contest links are posted in the Official Announcements WhatsApp community before each contest. Make sure to join to receive them on time.',
    },
    {
      q: 'Can I leave the community anytime?',
      a: 'Yes, you are free to leave at any time. However, we recommend staying connected so you do not miss important contest updates and results.',
    },
  ];

  const isLoading = loadingCommunity || loadingSocial;

  return (
    <div className="space-y-8 pb-8">

      {/* ── Page Header ── */}
      <motion.div variants={scaleIn} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
            <Users size={18} className="text-neon-cyan" />
          </div>
          <h1 className="heading-md">CWCL Community</h1>
        </div>
        <p className="text-text-secondary text-xs md:text-sm leading-relaxed max-w-2xl">
          Stay connected with the CBB Weekly Coding League community. Receive contest updates, discuss coding, and never miss an announcement.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Community Hub Grid ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Radio size={13} className="text-neon-cyan" />
              <h2 className="font-heading text-sm text-white font-bold tracking-wide uppercase">Community Hub</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Card 1 — Official Announcements */}
              <CommunityCard
                index={0}
                icon={Megaphone}
                title="Official Announcements"
                description="Receive official contest announcements, contest links, result notifications, monthly winners, certificates, and important updates. Only administrators can send messages."
                benefits={[
                  'Contest Reminders',
                  'Contest Links',
                  'Results',
                  'Monthly Winners',
                  'Certificates',
                  'Important Updates',
                ]}
                buttonLabel="Join WhatsApp"
                buttonHref={community.announcementWhatsapp || undefined}
                accentColor="neon-cyan"
              />

              {/* Card 2 — Community Discussion */}
              <CommunityCard
                index={1}
                icon={MessageCircle}
                title="Community Discussion"
                description="Connect with fellow participants. Discuss competitive programming, share resources, ask coding doubts, build teams, and network with students from different colleges. Everyone can participate."
                benefits={[
                  'Discuss Competitive Programming',
                  'Share Resources',
                  'Ask Coding Doubts',
                  'Build Teams',
                  'Network with Students',
                  'Open for Everyone',
                ]}
                buttonLabel="Join Community"
                buttonHref={community.discussionWhatsapp || undefined}
                accentColor="electric-blue"
              />
            </div>
          </div>

          {/* ── Discord — Coming Soon ── */}
          <div>
            <CommunityCard
              index={2}
              icon={MessageSquare}
              title="Discord Server"
              description="Join our official Discord server with dedicated channels for Competitive Programming, Announcements, Resources, Help, and General discussion."
              benefits={[
                'Competitive Programming Channel',
                'Announcements Channel',
                'Resources Channel',
                'Help Channel',
                'General Channel',
              ]}
              buttonLabel="Join Discord"
              buttonHref={community.discord || undefined}
              accentColor="purple"
              disabled={!community.discord}
            />
          </div>

          {/* ── Social Links ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={13} className="text-neon-cyan" />
              <h2 className="font-heading text-sm text-white font-bold tracking-wide uppercase">Follow Us</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SocialButton
                icon={InstagramIcon} label="Instagram" action="Follow"
                href={social.instagram || undefined} color="#E4405F"
              />
              <SocialButton
                icon={LinkedinIcon} label="LinkedIn" action="Connect"
                href={social.linkedin || undefined} color="#0A66C2"
              />
              <SocialButton
                icon={XTwitterIcon} label="X (Twitter)" action="Follow"
                href={social.twitter || undefined} color="#FFFFFF"
              />
              <SocialButton
                icon={CBBWebsiteIcon} label="Website" action="Visit"
                href={social.website || undefined} color="#00E5FF"
              />
            </div>
          </motion.div>

          {/* ── Latest Announcements ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-neon-cyan" />
                <h2 className="font-heading text-sm text-white font-bold tracking-wide uppercase">Latest Announcements</h2>
              </div>
              <Link to="/dashboard/announcements" className="text-neon-cyan text-xs hover:underline flex items-center gap-1">
                View All <ChevronRight size={12} />
              </Link>
            </div>
            {loadingAnnouncements ? (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="card text-center py-10">
                <Megaphone size={32} className="text-neon-cyan/20 mx-auto mb-2" />
                <p className="text-text-secondary text-sm">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className="bg-card-dark border border-neon-cyan/15 rounded-xl px-5 py-4 hover:border-neon-cyan/40 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-xs font-semibold">{a.title}</h4>
                        <p className="text-text-secondary/70 text-[11px] mt-1 line-clamp-2 leading-relaxed">{a.body}</p>
                      </div>
                      <span className="text-[10px] text-text-secondary/40 shrink-0 whitespace-nowrap">
                        {(a as any).createdAt?.seconds
                          ? new Date((a as any).createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── FAQ ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={13} className="text-neon-cyan" />
              <h2 className="font-heading text-sm text-white font-bold tracking-wide uppercase">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-2">
              {faqs.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </motion.div>

          {/* ── Need Help ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}
            className="bg-card-dark border border-neon-cyan/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center shrink-0">
                <HelpCircle size={18} className="text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Need Help?</h3>
                <p className="text-text-secondary text-xs mt-0.5">Contact the CWCL organizers for any queries or support.</p>
              </div>
            </div>
            <a
              href={social.instagram || '#'} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-xs px-5 py-2.5 flex items-center gap-2 shrink-0"
            >
              <MessageCircle size={13} /> Contact Organizers
            </a>
          </motion.div>
        </>
      )}
    </div>
  );
}
