import { BookOpen, AlertCircle, Info } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';

const RULES = [
  {
    section: '1. Eligibility',
    items: [
      'Open to all undergraduate students from any college across India.',
      'Only one registration per student. Multiple accounts will lead to disqualification.',
      'Participants must provide accurate college and personal details during registration.',
      'Participants may be asked to verify their identity before prize distribution.',
    ],
  },
  {
    section: '2. Contest Format & Difficulty Multipliers',
    items: [
      'Contests are held every Saturday — either Online or Offline, as announced in the schedule.',
      'Online contests are hosted on platforms such as HackerRank, Codeforces, CodeChef, or similar.',
      'Contest Difficulty Multipliers: Easy (1.0x), Medium (1.1x), Hard (1.2x), Special Challenge (1.3x).',
      'Contest Field Size Multipliers: 1–30 (1.0x), 31–75 (1.05x), 76–150 (1.10x), 151–300 (1.15x), 300+ (1.20x).',
    ],
  },
  {
    section: '3. Registration for Each Contest',
    items: [
      'CWCL registration is a one-time process — you do not register separately for each contest.',
      'Your contest handle (on HackerRank, Codeforces, CodeChef, etc.) must match what you submitted during CWCL registration for your results to be tracked.',
      'Results are imported by admins after each contest — ensure your handle is correctly set in your CWCL profile.',
    ],
  },
  {
    section: '4. Scoring and Monthly League Points (v1.0)',
    items: [
      'Rank 1: 100 LP, Rank 2: 95 LP, Rank 3: 90 LP, Rank 4: 87 LP, Rank 5: 84 LP.',
      'Rank 6: 82 LP, Rank 7: 80 LP, Rank 8: 78 LP, Rank 9: 76 LP, Rank 10: 74 LP.',
      'Ranks 11–20: 60 LP, Ranks 21–40: 40 LP, Ranks 41–60: 25 LP, Ranks 61+: 10 LP.',
      'Participation Rule: Only participants with at least one accepted submission receive points.',
      'Monthly League Points reset every month and are used strictly for monthly cash prizes (Rs.3000, Rs.2000, Rs.1000).',
    ],
  },
  {
    section: '5. CWCL Rating System v1.0',
    items: [
      'Every participant starts at a Rating of 800 (Beginner). Rating is permanent and never resets.',
      'Minimum Rating Floor: 800. Rating can never fall below 800.',
      '9 Official Rating Titles: Beginner (800–899), Explorer (900–999), Coder (1000–1099), Specialist (1100–1249), Expert (1250–1449), Candidate Master (1450–1649), Master (1650–1849), Grandmaster (1850–2099), Legendary Grandmaster (2100+).',
      'Performance Zones: Top 5% (+35), Top 15% (+25), Top 30% (+15), Middle 40% (+5), Bottom 20% (-5), Bottom 10% (-15).',
      'Expected Performance & Upset Bonuses: Outperforming expected rank or defeating higher-rated players awards additional bonus points (+5 to +15).',
      'Consistency Milestone Bonus: 4 consecutive contests (+5), 8 consecutive (+10), 12 consecutive (+15). Maximum +15 once per milestone.',
      'Clamping: Maximum Rating Increase +50, Maximum Rating Decrease -30 per contest.',
    ],
  },
  {
    section: '6. Fair Play',
    items: [
      'Plagiarism or sharing solutions with other participants during a contest is strictly prohibited.',
      'Use of AI code generation tools (ChatGPT, Copilot, etc.) during a live contest is not allowed.',
      'Any form of collaboration during an individual contest is grounds for disqualification.',
      'Admins reserve the right to disqualify any participant suspected of malpractice.',
    ],
  },
  {
    section: '7. Monthly Prizes & Tie Breakers',
    items: [
      'Monthly prizes: Rs.3,000 (1st), Rs.2,000 (2nd), Rs.1,000 (3rd) based on cumulative Monthly League Points.',
      'Monthly Tie-breakers: 1. Higher average contest score, 2. Lower total penalty, 3. More contests played, 4. Better latest contest rank.',
      'Prizes are distributed within 7 days of the end of each month after identity verification.',
    ],
  },
  {
    section: '8. Certificates',
    items: [
      'Participation certificates are auto-generated for every contest you participate in.',
      'Winner and Monthly Champion certificates are issued to top finishers.',
      'All certificates include a unique verification code to confirm authenticity.',
      'Certificates can be downloaded from your dashboard.',
    ],
  },
  {
    section: '9. Code of Conduct',
    items: [
      'Treat all participants, admins, and organizers with respect.',
      'Harassment, discrimination, or abusive language — online or offline — will not be tolerated.',
      'Any disputes regarding results or disqualifications must be raised within 48 hours via official channels.',
      'Decisions made by CWCL admins and organizers are final.',
    ],
  },
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-midnight pt-20 pb-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <CBBLogo size={56} glow={false} />
          </div>
          <h1 className="heading-lg mb-3">Contest Rules</h1>
          <p className="text-text-secondary text-sm">
            CWCL Season 2026-27 — Please read carefully before registering.
          </p>
        </div>

        {/* Platform note */}
        <div className="flex gap-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg px-4 py-3 mb-6">
          <Info size={15} className="text-neon-cyan shrink-0 mt-0.5" />
          <p className="text-neon-cyan/90 text-xs leading-relaxed">
            CWCL contests are hosted on various platforms including HackerRank, Codeforces,
            CodeChef, and others. The platform for each contest is announced on the Schedule
            page at least 24 hours in advance.
          </p>
        </div>

        {/* Warning */}
        <div className="flex gap-3 bg-warning/5 border border-warning/20 rounded-lg px-4 py-3 mb-8">
          <AlertCircle size={15} className="text-warning shrink-0 mt-0.5" />
          <p className="text-warning/90 text-xs leading-relaxed">
            By registering, you agree to all rules on this page. Violations may result in
            disqualification and forfeiture of prizes or certificates.
          </p>
        </div>

        {/* Rules list */}
        <div className="space-y-4">
          {RULES.map(({ section, items }) => (
            <div key={section} className="card">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={13} className="text-neon-cyan shrink-0" />
                <h2 className="heading-sm text-sm">{section}</h2>
              </div>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-secondary text-xs leading-relaxed">
                    <span className="text-neon-cyan/50 mt-0.5 shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-text-secondary/60 text-xs">
            Last updated: July 2026 — Coding Brigade BVRIT x CSI BVRIT
          </p>
        </div>

      </div>
    </div>
  );
}
