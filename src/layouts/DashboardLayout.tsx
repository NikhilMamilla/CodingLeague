import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, BarChart2, Award, LogOut,
  Menu, X, Home, ChevronRight, TrendingUp, Trophy, Megaphone, BookOpen, Compass, Users,
} from 'lucide-react';
import CBBLogo from '../components/ui/CBBLogo';
import LoginNotifications from '../components/LoginNotifications';
import { useAuth } from '../contexts/AuthContext';

const LINKS = [
  { to: '/dashboard',              label: 'Overview',       icon: LayoutDashboard, end: true  },
  { to: '/dashboard/guide',        label: 'CWCL Guide',     icon: Compass,         end: false },
  { to: '/dashboard/leaderboard',  label: 'Leaderboard',    icon: Trophy,          end: false },
  { to: '/dashboard/announcements',label: 'Announcements',  icon: Megaphone,       end: false },
  { to: '/dashboard/community',    label: 'Community',      icon: Users,           end: false },
  { to: '/dashboard/profile',      label: 'My Profile',     icon: User,            end: false },
  { to: '/dashboard/stats',        label: 'My Stats',       icon: BarChart2,       end: false },
  { to: '/dashboard/certificates', label: 'Certificates',   icon: Award,           end: false },
  { to: '/rules',                  label: 'Rules',          icon: BookOpen,        end: false },
];

const TIER_CLASS: Record<string, string> = {
  Beginner:    'tier-beginner',
  Explorer:    'tier-explorer',
  Coder:       'tier-coder',
  Expert:      'tier-expert',
  Master:      'tier-master',
  Grandmaster: 'tier-grandmaster',
};

const TIER_NEXT: Record<string, number> = {
  Beginner: 1000, Explorer: 1200, Coder: 1500,
  Expert: 1800, Master: 2200, Grandmaster: 9999,
};
const TIER_NEXT_NAME: Record<string, string> = {
  Beginner: 'Explorer', Explorer: 'Coder', Coder: 'Expert',
  Expert: 'Master', Master: 'Grandmaster', Grandmaster: 'Max',
};

const TIER_MIN: Record<string, number> = {
  Beginner: 0, Explorer: 1000, Coder: 1200,
  Expert: 1500, Master: 1800, Grandmaster: 2200,
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, participant } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const initial  = participant?.fullName?.charAt(0)?.toUpperCase() ?? 'U';
  const rating   = participant?.rating ?? 800;
  const tier     = participant?.tier   ?? 'Beginner';
  const tierMin  = TIER_MIN[tier]  ?? 0;
  const tierNext = TIER_NEXT[tier] ?? 1000;
  const pct      = tier === 'Grandmaster'
    ? 100
    : Math.min(100, Math.round(((rating - tierMin) / (tierNext - tierMin)) * 100));
  const nextTierName = TIER_NEXT_NAME[tier] ?? 'Explorer';

  return (
    <div className="h-screen bg-midnight flex overflow-hidden">

      {/* ══ Sidebar ══ */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#070d1a] border-r border-neon-cyan/10
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>

        {/* ── Logo ── */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-neon-cyan/10 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <CBBLogo size={30} glow />
            <div>
              <div className="font-heading text-xs text-neon-cyan tracking-widest leading-none">CWCL</div>
              {/* <div className="text-[9px] text-text-secondary/50 tracking-wider">Dashboard</div> */}
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-text-secondary hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* ── Nav links — takes all available space ── */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body
                 transition-all duration-200 group ${
                  isActive
                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                    : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={11} className="opacity-30 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom section: Profile card + actions ── */}
        <div className="shrink-0 border-t border-neon-cyan/10">

          {/* Profile card — just above logout */}
          {participant && (
            <div className="px-4 py-4 border-b border-neon-cyan/10">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {participant.photoURL
                    ? <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
                    : <span className="font-heading text-base text-neon-cyan font-bold">{initial}</span>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-body text-white truncate font-semibold">
                    {participant.fullName}
                  </div>
                  <div className="text-[10px] font-numbers text-text-secondary/70 truncate">
                    {participant.participantId}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`${TIER_CLASS[tier]} !text-[9px] !px-1.5 !py-0`}>{tier}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-neon-cyan font-numbers">
                      <TrendingUp size={9} />{rating}
                    </span>
                  </div>
                </div>
              </div>
              {/* Rating progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-text-secondary/50 mb-1">
                  <span>Progress to {nextTierName}</span>
                  <span className="text-neon-cyan">{pct}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-neon-cyan rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Back to site + Logout */}
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

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-midnight/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══ Main content ══ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Mobile topbar */}
        <div className="lg:hidden h-14 bg-[#070d1a] border-b border-neon-cyan/10 flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-text-secondary hover:text-neon-cyan p-1">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <CBBLogo size={22} glow={false} />
            <span className="font-heading text-xs text-neon-cyan tracking-widest">CWCL</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center overflow-hidden">
            {participant?.photoURL
              ? <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
              : <span className="font-heading text-xs text-neon-cyan font-bold">{initial}</span>
            }
          </div>
        </div>

        {/* Page content */}
        <main id="main-scroll" className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Login-time notifications for new badges / certificates */}
      <LoginNotifications />
    </div>
  );
}
