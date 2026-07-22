import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Upload, Users,
  Megaphone, LogOut, ChevronRight, Menu,
} from 'lucide-react';
import CBBLogo from '../components/ui/CBBLogo';
import { useAuth } from '../contexts/AuthContext';

const LINKS = [
  { to: '/admin',                label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/admin/contests',       label: 'Contests',        icon: Calendar        },
  { to: '/admin/results',        label: 'Import Results',  icon: Upload          },
  { to: '/admin/users',          label: 'Participants',    icon: Users           },
  { to: '/admin/announcements',  label: 'Announcements',  icon: Megaphone       },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, participant } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-midnight flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-navy border-r border-electric-blue/20 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}
      >
        <div className="h-16 flex items-center px-4 border-b border-electric-blue/20 gap-2">
          <CBBLogo size={32} glow={true} />
          <div className="leading-tight">
            <div className="font-heading text-xs text-electric-blue tracking-widest">CWCL Admin</div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-electric-blue/10 text-xs text-text-secondary font-body">
          {participant?.fullName ?? 'Admin'}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body transition-all duration-200 ${
                  isActive
                    ? 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={14} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={12} className="opacity-40" />
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-electric-blue/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-midnight/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden h-14 bg-navy border-b border-electric-blue/20 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-text-secondary hover:text-electric-blue">
            <Menu size={18} />
          </button>
          <span className="font-heading text-xs text-electric-blue tracking-widest">CWCL Admin</span>
        </div>
        <main className="flex-1 bg-midnight overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
