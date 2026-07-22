import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, BarChart2, Award, LogOut, Menu, ChevronRight,
} from 'lucide-react';
import CBBLogo from '../components/ui/CBBLogo';
import { useAuth } from '../contexts/AuthContext';

const LINKS = [
  { to: '/dashboard',              label: 'Overview',       icon: LayoutDashboard },
  { to: '/dashboard/profile',      label: 'My Profile',     icon: User            },
  { to: '/dashboard/stats',        label: 'My Stats',       icon: BarChart2       },
  { to: '/dashboard/certificates', label: 'Certificates',   icon: Award           },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, participant } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-midnight flex">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-navy border-r border-neon-cyan/10 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-neon-cyan/10">
          <div className="flex items-center gap-2.5">
            <CBBLogo size={32} glow={true} />
            <span className="font-heading text-xs text-neon-cyan tracking-widest">CWCL</span>
          </div>
        </div>

        {/* Participant Summary */}
        <div className="px-4 py-4 border-b border-neon-cyan/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neon-cyan/20 flex items-center justify-center">
              <span className="font-heading text-sm text-neon-cyan font-bold">
                {participant?.fullName?.charAt(0) ?? 'U'}
              </span>
            </div>
            <div className="leading-tight overflow-hidden">
              <div className="text-xs font-body text-white truncate">{participant?.fullName ?? 'Participant'}</div>
              <div className="text-[10px] font-numbers text-neon-cyan">{participant?.participantId ?? ''}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body transition-all duration-200 ${
                  isActive
                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
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

        {/* Logout */}
        <div className="px-3 py-4 border-t border-neon-cyan/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-midnight/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <div className="md:hidden h-14 bg-navy border-b border-neon-cyan/10 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-text-secondary hover:text-neon-cyan">
            <Menu size={18} />
          </button>
          <span className="font-heading text-xs text-neon-cyan tracking-widest">CWCL Dashboard</span>
        </div>

        <main className="flex-1 bg-midnight overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
