import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, Trophy, Megaphone, Upload,
  Clock, AlertCircle, ChevronRight, Shield, Award, Crown, Database,
} from 'lucide-react';
import type { Contest, Announcement, Participant } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getParticipants, getContests, getAnnouncements, getAllResults, getCertificates } from '../../lib/db';
import { runMigration } from '../../lib/migrate';
import toast from 'react-hot-toast';

interface Counts { participants: number; contests: number; results: number; announcements: number; badges: number; certificates: number; foundingMembers: number; }

function StatCard({ icon: Icon, label, value, color = 'text-neon-cyan', to }: {
  icon: React.ElementType; label: string; value: number;
  color?: string; to: string;
}) {
  return (
    <Link to={to} className="card flex items-center gap-4 py-5 hover:border-neon-cyan/50 group transition-all">
      <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0 group-hover:bg-neon-cyan/20 transition-colors">
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-text-secondary text-[10px] uppercase tracking-widest">{label}</div>
        <div className={`stat-number text-2xl ${color}`}>{value}</div>
      </div>
      <ChevronRight size={14} className="text-text-secondary/30 group-hover:text-neon-cyan transition-colors shrink-0" />
    </Link>
  );
}

const STATUS_COLOR: Record<string, string> = {
  Upcoming:  'bg-warning/10 text-warning border-warning/30',
  Active:    'bg-success/10 text-success border-success/30',
  Completed: 'bg-white/5 text-text-secondary border-white/10',
};

export default function AdminDashboard() {
  const { participant } = useAuth();
  const [counts,        setCounts]        = useState<Counts>({ participants: 0, contests: 0, results: 0, announcements: 0, badges: 0, certificates: 0, foundingMembers: 0 });
  const [contests,      setContests]      = useState<Contest[]>([]);
  const [recent,        setRecent]        = useState<Participant[]>([]);
  const [announcements, setAnnouncements] = useState<(Announcement & { id: string })[]>([]);
  const [migrating,     setMigrating]     = useState(false);

  useEffect(() => {
    Promise.all([
      getParticipants(500),
      getContests(),
      getAllResults(),
      getAnnouncements(3),
      getCertificates(),
    ]).then(([parts, contests, results, announcements, certs]) => {
      const nonAdmin = parts.filter(p => p.role !== 'admin');
      setCounts({
        participants: nonAdmin.length,
        contests: contests.length,
        results: results.length,
        announcements: announcements.length,
        badges: nonAdmin.reduce((s, p) => s + (p.badges?.length ?? 0), 0),
        certificates: certs.length,
        foundingMembers: nonAdmin.filter(p => p.foundingMember).length,
      });
      setContests(contests.slice(0, 5));
      setRecent(nonAdmin.slice(0, 5));
      setAnnouncements(announcements);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="card-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-md">Admin Dashboard</h1>
          <p className="text-text-secondary text-xs mt-1">
            CWCL Season 2026–27 · Logged in as{' '}
            <span className="text-electric-blue">{participant?.fullName ?? 'Admin'}</span>
          </p>
        </div>
        <div className="hidden sm:flex gap-3 flex-wrap">
          <button
            onClick={async () => {
              const already = localStorage.getItem('cwcl_migration_done');
              if (already) {
                toast.error('Migration already completed. Remove this button to prevent accidental re-runs.');
                return;
              }
              if (!confirm('This will copy ALL data from Firestore to Supabase. Run only ONCE. Continue?')) return;
              setMigrating(true);
              toast.loading('Migrating data…', { id: 'migration' });
              try {
                await runMigration();
                localStorage.setItem('cwcl_migration_done', 'true');
                toast.success('Migration complete! Refresh the page.', { id: 'migration', duration: 8000 });
              } catch (e: any) {
                toast.error('Migration failed: ' + e.message, { id: 'migration' });
              }
              setMigrating(false);
            }}
            disabled={migrating}
            className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 border-warning/40 text-warning hover:bg-warning/10 disabled:opacity-50"
          >
            <Database size={12} /> {migrating ? 'Migrating…' : 'Migrate Firestore → Supabase'}
          </button>
          <Link to="/admin/certificates" className="btn-primary text-xs px-4 py-2 flex items-center gap-2">
            <Award size={12} /> Manage Certificates
          </Link>
          <Link to="/admin/contests" className="btn-secondary text-xs px-4 py-2 flex items-center gap-2">
            <Calendar size={12} /> New Contest
          </Link>
        </div>
      </div>

      {/* Stats — real-time */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
        <StatCard icon={Users}     label="Participants"   value={counts.participants}  color="text-neon-cyan"           to="/admin/users" />
        <StatCard icon={Calendar}  label="Contests"       value={counts.contests}      color="text-electric-blue"       to="/admin/contests"      />
        <StatCard icon={Trophy}    label="Results"        value={counts.results}       color="text-success"             to="/admin/results"       />
        <StatCard icon={Award}     label="Certificates"   value={counts.certificates}  color="text-neon-cyan font-bold" to="/admin/certificates" />
        <StatCard icon={Shield}    label="Badges"         value={counts.badges}        color="text-gold"                to="/admin/badges"        />
        <StatCard icon={Megaphone} label="Announcements"  value={counts.announcements} color="text-warning"             to="/admin/announcements" />
        <StatCard icon={Crown}     label="Founding"       value={counts.foundingMembers} color="text-gold"              to="/admin/founding-members" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Award,     label: 'Certificates System', desc: 'Generate & issue official certificates', to: '/admin/certificates' },
          { icon: Calendar,  label: 'Create Contest',      desc: 'Schedule a new weekly contest',       to: '/admin/contests'      },
          { icon: Upload,    label: 'Import Results',      desc: 'Upload CSV results for a contest',    to: '/admin/results'       },
          { icon: Users,     label: 'Manage Participants', desc: 'View and manage all registrations',   to: '/admin/users'         },
          { icon: Shield,    label: 'Manage Badges',       desc: 'Award, revoke and auto-evaluate',     to: '/admin/badges'        },
          { icon: Crown,     label: 'Founding Members',    desc: 'Assign founding status to early users', to: '/admin/founding-members' },
          { icon: Megaphone, label: 'Post Announcement',   desc: 'Send a notice to all participants',   to: '/admin/announcements' },
        ].map(({ icon: Icon, label, desc, to }) => (
          <Link key={to} to={to}
            className="card hover:border-electric-blue/40 transition-all flex gap-3 items-start group">
            <div className="w-9 h-9 rounded-lg bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-electric-blue/20 transition-colors">
              <Icon size={15} className="text-electric-blue" />
            </div>
            <div>
              <div className="font-heading text-white text-xs font-bold mb-0.5">{label}</div>
              <div className="text-text-secondary text-[10px] leading-relaxed">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Contests + Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-neon-cyan" />
              <h2 className="font-heading text-sm font-bold text-neon-cyan">Contest Schedule</h2>
            </div>
            <Link to="/admin/contests" className="text-neon-cyan text-xs hover:underline flex items-center gap-1">
              Manage <ChevronRight size={11} />
            </Link>
          </div>
          {contests.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={28} className="text-neon-cyan/20 mx-auto mb-2" />
              <p className="text-text-secondary text-sm">No contests yet.</p>
              <Link to="/admin/contests" className="text-neon-cyan text-xs hover:underline mt-1 inline-block">Create one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {contests.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-midnight hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                    <Clock size={13} className="text-neon-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{c.name}</div>
                    <div className="text-text-secondary/60 text-[10px]">{c.date} · {c.startTime} · {c.mode}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] shrink-0 ${STATUS_COLOR[c.status] ?? STATUS_COLOR.Upcoming}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-neon-cyan" />
              <h2 className="font-heading text-sm font-bold text-neon-cyan">Recent Registrations</h2>
            </div>
            <Link to="/admin/users" className="text-neon-cyan text-xs hover:underline flex items-center gap-1">
              View All <ChevronRight size={11} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <Users size={28} className="text-neon-cyan/20 mx-auto mb-2" />
              <p className="text-text-secondary text-sm">No participants yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(p => (
                <div key={p.uid} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                    <span className="font-heading text-xs text-neon-cyan font-bold">{p.fullName?.charAt(0)?.toUpperCase() ?? '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{p.fullName}</div>
                    <div className="text-text-secondary/60 text-[10px]">{p.college} · {p.branch}</div>
                  </div>
                  <span className="text-text-secondary/40 text-[10px] font-numbers shrink-0">{p.participantId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone size={14} className="text-neon-cyan" />
            <h2 className="font-heading text-sm font-bold text-neon-cyan">Recent Announcements</h2>
          </div>
          <Link to="/admin/announcements" className="text-neon-cyan text-xs hover:underline flex items-center gap-1">
            Manage <ChevronRight size={11} />
          </Link>
        </div>
        {announcements.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-6">No announcements yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {announcements.map(a => (
              <div key={a.id} className="border-l-2 border-electric-blue/40 pl-3">
                <div className="text-white text-xs font-medium">{a.title}</div>
                <div className="text-text-secondary/60 text-[10px] mt-0.5 line-clamp-2">{a.body}</div>
                <div className="text-electric-blue/50 text-[9px] mt-1 uppercase tracking-wider">{a.category}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
