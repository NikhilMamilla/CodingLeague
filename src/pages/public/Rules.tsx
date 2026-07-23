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
    section: '2. Contest Format',
    items: [
      'Contests are held every Saturday — either Online or Offline, as announced in the schedule.',
      'Online contests are hosted on platforms such as HackerRank, Codeforces, CodeChef, or similar — the platform is announced before each contest.',
      'Offline contests are held at BVRIT campus. Participants must be physically present.',
      'Contest duration is typically 1.5 to 2 hours unless stated otherwise.',
      'Problem types are algorithmic and competitive programming style.',
      'All contest details (platform link, venue, timing) are published on the Schedule page before the event.',
    ],
  },
  {
    section: '3. Registration for Each Contest',
    items: [
      'CWCL registration is a one-time process — you do not register separately for each contest.',
      'For online contests, participants must register on the respective platform using the link provided.',
      'Your contest handle (on HackerRank, Codeforces, CodeChef, etc.) must match what you submitted during CWCL registration for your results to be tracked.',
      'Results are imported by admins after each contest — ensure your handle is correctly set in your CWCL profile.',
    ],
  },
  {
    section: '4. Scoring and League Points',
    items: [
      '1st place: 100 LP, 2nd: 95 LP, 3rd: 90 LP, 4th: 87 LP, 5th: 85 LP.',
      'All other participants who submit at least one problem: 10 LP.',
      'Not participating in a contest: 0 LP for that week.',
      'Monthly rankings are based on cumulative League Points across all contests that month.',
      'Tie-breakers: Total Score first, then lower Penalty.',
    ],
  },
  {
    section: '5. Fair Play',
    items: [
      'Plagiarism or sharing solutions with other participants during a contest is strictly prohibited.',
      'Use of AI code generation tools (ChatGPT, Copilot, etc.) during a live contest is not allowed.',
      'Any form of collaboration during an individual contest is grounds for disqualification.',
      'Participants found submitting pre-written or shared solutions will be disqualified.',
      'Admins reserve the right to disqualify any participant suspected of malpractice.',
    ],
  },
  {
    section: '6. Rating System',
    items: [
      'Every participant starts with a rating of 800 (Beginner tier).',
      'Ratings are updated after each contest using a performance-based algorithm.',
      'Tiers: Beginner (800), Explorer (1000), Coder (1200), Expert (1500), Master (1800), Grandmaster (2200+).',
      'Rating changes depend on your rank relative to other participants\' expected performance.',
    ],
  },
  {
    section: '7. Monthly Prizes',
    items: [
      'Monthly prizes: Rs.3,000 (1st), Rs.2,000 (2nd), Rs.1,000 (3rd) based on League Points.',
      'Prizes are distributed within 7 days of the end of each month.',
      'Winners must verify their identity before receiving prizes.',
      'Prizes are non-transferable.',
      'If a winner is found to have violated any rules, the prize will be forfeited and awarded to the next eligible participant.',
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
      'Any disputes regarding results or disqualifications must be raised within 48 hours via the official contact.',
      'Decisions made by CWCL admins and organizers are final.',
    ],
  },
  {
    section: '10. Schedule Changes',
    items: [
      'CWCL reserves the right to change contest dates, modes, or platforms with prior notice.',
      'All participants will be notified via email and the platform announcements section.',
      'In case of technical issues on an external platform, CWCL will take appropriate action and communicate it to all participants.',
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
