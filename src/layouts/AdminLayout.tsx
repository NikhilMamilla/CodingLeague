import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Upload, Users,
  Megaphone, LogOut, Menu, X, Home, ChevronRight,
  Shield, Database, Handshake,
} from 'lucide-react';
import CBBLogo from '../components/ui/CBBLogo';
import { useAuth } from '../contexts/AuthContext';

const LINKS = [
  { to: '/admin',               label: 'Overview',      icon: LayoutDashboard, end: true  },
  { to: '/admin/contests',      label: 'Contests',      icon: Calendar,        end: false },
  { to: '/admin/results',       label: 'Import Results',icon: Upload,          end: false },
  { to: '/admin/users',         label: 'Participants',  icon: Users,           end: false },
  { to: '/admin/badges',        label: 'Badges',        icon: Shield,          end: false },
  { to: '/admin/sponsors',      label: 'Sponsors',      icon: Handshake,       end: false },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone,       end: false },
  { to: '/admin/seed',          label: 'Seed Schedule', icon: Database,        end: false },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { logout, participant } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() { await logout(); navigate('/'); }

  return (
    <div className="h-screen bg-midnight flex overflow-hidden">

      {/* ══ Sidebar ══ */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#070d1a] border-r border-electric-blue/15
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-electric-blue/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <CBBLogo size={30} glow />
            <div>
              <div className="font-heading text-xs text-electric-blue tracking-widest leading-none">CWCL</div>
              <div className="text-[9px] text-text-secondary/50 tracking-wider">Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-text-secondary hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body
                 transition-all duration-200 group border ${
                  isActive
                    ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/25'
                    : 'text-text-secondary hover:text-white hover:bg-white/5 border-transparent'
                }`}>
              <Icon size={14} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={11} className="opacity-30 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Admin identity + actions at bottom */}
        <div className="shrink-0 border-t border-electric-blue/15">
          {participant && (
            <div className="px-4 py-4 border-b border-electric-blue/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center shrink-0">
                  <Shield size={14} className="text-electric-blue" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-white font-semibold truncate">{participant.fullName}</div>
                  <div className="text-[10px] text-electric-blue font-numbers">Administrator</div>
                </div>
              </div>
            </div>
          )}
          <div className="px-3 py-3 space-y-1">
            <Link to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
              <Home size={14} /> Back to Site
            </Link>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body text-text-secondary hover:text-red-400 hover:bg-red-500/5 transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-midnight/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ══ Main ══ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden h-14 bg-[#070d1a] border-b border-electric-blue/15 flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setOpen(true)} className="text-text-secondary hover:text-electric-blue p-1">
            <Menu size={18} />
          </button>
          <CBBLogo size={22} glow={false} />
          <span className="font-heading text-xs text-electric-blue tracking-widest">Admin Panel</span>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
