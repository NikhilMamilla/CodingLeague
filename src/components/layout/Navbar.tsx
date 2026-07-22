import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import CBBLogo from '../ui/CBBLogo';
import { useAuth } from '../../contexts/AuthContext';

// ── Correct logical order ──────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'About',        to: '/about'        },
  { label: 'Schedule',     to: '/schedule'     },
  { label: 'Rules',        to: '/rules'        },
  { label: 'FAQs',         to: '/faqs'         },
  { label: 'Leaderboard',  to: '/leaderboard'  },
  { label: 'Winners',      to: '/winners'      },
  { label: 'Hall of Fame', to: '/hall-of-fame' },
  { label: 'Sponsors',     to: '/sponsors'     },
  { label: 'Gallery',      to: '/gallery'      },
];

export default function Navbar() {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, participant, logout }   = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu and reset body overflow on every route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    // Always clean up on unmount
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    navigate('/');
  }

  return (
    <>
      {/* ── Fixed header bar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled && !mobileOpen
            ? 'bg-midnight/95 backdrop-blur-md border-b border-neon-cyan/10'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 shrink-0">
            <CBBLogo size={36} glow={false} />
            <div className="leading-tight">
              <div className="font-heading text-xs font-bold text-neon-cyan tracking-widest">CWCL</div>
              {/* <div className="font-body text-[9px] text-text-secondary tracking-wider hidden sm:block">'26–27</div> */}
            </div>
          </Link>

          {/* ── Desktop Nav — hidden on smaller screens ── */}
          <ul className="hidden lg:flex items-center gap-5 xl:gap-7">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `text-[11px] uppercase tracking-widest font-body transition-colors duration-200 whitespace-nowrap ${
                      isActive ? 'text-neon-cyan' : 'text-text-secondary hover:text-white'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* ── Desktop Auth ── */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg px-3 py-2 hover:bg-neon-cyan/10 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                    <span className="text-neon-cyan text-xs font-heading font-bold">
                      {participant?.fullName?.charAt(0) ?? 'U'}
                    </span>
                  </div>
                  <span className="text-white text-xs font-body">
                    {participant?.fullName?.split(' ')[0] ?? 'User'}
                  </span>
                  <ChevronDown size={12} className="text-text-secondary" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card-dark border border-neon-cyan/20 rounded-lg overflow-hidden shadow-2xl">
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-xs text-text-secondary hover:text-white hover:bg-neon-cyan/5 transition-colors"
                    >
                      <LayoutDashboard size={13} /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-secondary hover:text-white hover:bg-neon-cyan/5 transition-colors"
                    >
                      <LogOut size={13} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"    className="text-text-secondary hover:text-white text-xs uppercase tracking-widest font-body transition-colors">Login</Link>
                <Link to="/register" className="btn-primary text-xs py-2 px-5">Register</Link>
              </>
            )}
          </div>

          {/* ── Hamburger (mobile + tablet) ── */}
          <button
            className="lg:hidden text-text-secondary hover:text-neon-cyan transition-colors z-50 relative"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

        </nav>
      </header>

      {/* ── Fullscreen mobile overlay ── */}
      <div
        className={`fixed inset-0 z-40 lg:hidden flex flex-col items-center justify-center
          bg-midnight/98 backdrop-blur-xl
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Nav links — centered */}
        <ul className="flex flex-col items-center gap-2 w-full px-8">
          {NAV_LINKS.map((l, i) => (
            <li
              key={l.to}
              className="w-full max-w-xs"
              style={{
                transitionDelay: mobileOpen ? `${i * 40}ms` : '0ms',
                transform: mobileOpen ? 'translateY(0)' : 'translateY(16px)',
                opacity: mobileOpen ? 1 : 0,
                transition: 'transform 0.3s ease, opacity 0.3s ease',
              }}
            >
              <NavLink
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block text-center py-3 text-sm uppercase tracking-[0.2em] font-heading transition-colors duration-200 rounded-lg ${
                    isActive
                      ? 'text-neon-cyan bg-neon-cyan/10'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Auth buttons */}
        <div
          className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs px-8"
          style={{
            transitionDelay: mobileOpen ? `${NAV_LINKS.length * 40 + 20}ms` : '0ms',
            transform: mobileOpen ? 'translateY(0)' : 'translateY(16px)',
            opacity: mobileOpen ? 1 : 0,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
        >
          <div className="w-full h-px bg-neon-cyan/10" />
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary text-center py-2.5 text-xs w-full"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-text-secondary hover:text-white text-xs uppercase tracking-widest font-body transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary text-center py-2.5 text-xs w-full"
              >
                Register
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="text-text-secondary hover:text-white text-xs uppercase tracking-widest font-body transition-colors"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
