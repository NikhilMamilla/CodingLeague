import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import CBBLogo from '../ui/CBBLogo';
import { SOCIALS } from '../ui/SocialIcons';

const LINKS = [
  { label: 'About',        to: '/about'        },
  { label: 'Schedule',     to: '/schedule'     },
  { label: 'Rules',        to: '/rules'        },
  { label: 'FAQs',         to: '/faqs'         },
  { label: 'Leaderboard',  to: '/leaderboard'  },
  { label: 'Winners',      to: '/winners'      },
  { label: 'Hall of Fame', to: '/hall-of-fame' },
  { label: 'Gallery',      to: '/gallery'      },
];

export default function Footer() {
  return (
    <footer className="bg-navy border-t border-neon-cyan/10 px-4 md:px-8 py-8 md:py-10">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8 mb-6">

          {/* Brand + socials */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CBBLogo size={34} glow={false} />
              <div>
                <div className="font-heading text-xs font-bold text-neon-cyan tracking-widest leading-tight">
                  CBB WEEKLY CODING LEAGUE
                </div>
                <div className="font-body text-[10px] text-text-secondary mt-0.5">CWCL '26–27</div>
              </div>
            </div>
            <p className="text-text-secondary/70 text-[10px] leading-relaxed max-w-xs">
              Code Every Saturday. Rise Every Month. Organized by Coding Brigade BVRIT x CSI BVRIT.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-text-secondary/50 hover:text-neon-cyan transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
              {LINKS.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-text-secondary/70 text-xs hover:text-white transition-colors py-0.5 truncate"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-neon-cyan/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-text-secondary/40">
          <p>© 2026 Coding Brigade BVRIT. All rights reserved.</p>
          <a href="mailto:cbb@bvrit.ac.in" className="flex items-center gap-1.5 hover:text-neon-cyan transition-colors">
            <Mail size={10} /> cbb@bvrit.ac.in
          </a>
        </div>

      </div>
    </footer>
  );
}
