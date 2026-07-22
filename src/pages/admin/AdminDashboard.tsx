import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Trophy, Award, Upload, Megaphone } from 'lucide-react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Stats { participants: number; contests: number; certificates: number; announcements: number; }

function AdminCard({ icon: Icon, label, value, to }: {
  icon: React.ElementType; label: string; value: number | string; to: string;
}) {
  return (
    <Link to={to} className="card hover:border-neon-cyan/50 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center group-hover:bg-neon-cyan/20 transition-colors">
          <Icon size={16} className="text-neon-cyan" />
        </div>
      </div>
      <div className="stat-number text-2xl">{value}</div>
      <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1 font-body">{label}</div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ participants: 0, contests: 0, certificates: 0, announcements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, c, cert, ann] = await Promise.all([
          getCountFromServer(collection(db, 'participants')),
          getCountFromServer(collection(db, 'contests')),
          getCountFromServer(collection(db, 'certificates')),
          getCountFromServer(collection(db, 'announcements')),
        ]);
        setStats({
          participants:  p.data().count,
          contests:      c.data().count,
          certificates:  cert.data().count,
          announcements: ann.data().count,
        });
      } catch { /**/ } finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="heading-md mb-1">Admin Dashboard</h1>
        <p className="text-text-secondary text-xs">CWCL Season 2026–27 · Platform Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard icon={Users}     label="Participants"  value={loading ? '…' : stats.participants}  to="/admin/users"    />
        <AdminCard icon={Calendar}  label="Contests"      value={loading ? '…' : stats.contests}      to="/admin/contests" />
        <AdminCard icon={Award}     label="Certificates"  value={loading ? '…' : stats.certificates}  to="/admin/users"    />
        <AdminCard icon={Megaphone} label="Announcements" value={loading ? '…' : stats.announcements} to="/admin/announcements" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="heading-sm mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Calendar,  label: 'Create Contest',    desc: 'Schedule a new weekly contest',          to: '/admin/contests'      },
            { icon: Upload,    label: 'Import Results',    desc: 'Upload CSV results for a contest',       to: '/admin/results'       },
            { icon: Users,     label: 'Manage Users',      desc: 'View and manage registered participants', to: '/admin/users'        },
            { icon: Megaphone, label: 'Post Announcement', desc: 'Send a notice to all participants',      to: '/admin/announcements' },
            { icon: Trophy,    label: 'Manage Sponsors',   desc: 'Add or update sponsor listings',         to: '/admin/sponsors'      },
          ].map(({ icon: Icon, label, desc, to }) => (
            <Link key={to} to={to} className="card hover:border-neon-cyan/40 transition-all flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={16} className="text-neon-cyan" />
              </div>
              <div>
                <div className="font-heading text-white text-xs font-bold mb-0.5">{label}</div>
                <div className="text-text-secondary text-[10px] leading-relaxed">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
