import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CBBLogo from '../../components/ui/CBBLogo';

const FAQS = [
  {
    q: 'Is CWCL free to join?',
    a: 'Yes, completely free. One registration, zero fees, access to all contests for the entire season.',
  },
  {
    q: 'Do I need to be from BVRIT?',
    a: 'No. CWCL is open to undergraduate students from any college across India.',
  },
  {
    q: 'How often are contests held?',
    a: 'Every Saturday. The schedule alternates between Online and Offline contests based on the season calendar.',
  },
  {
    q: 'Which platforms are used for online contests?',
    a: 'Online contests are hosted on platforms like HackerRank, Codeforces, CodeChef, and others. The exact platform is announced on the Schedule page at least 24 hours before each contest.',
  },
  {
    q: 'What if I miss a contest?',
    a: 'You earn 0 League Points for that week. Since monthly rankings are cumulative, regular participation is essential to stay competitive.',
  },
  {
    q: 'How are monthly winners decided?',
    a: 'Monthly winners are ranked by cumulative League Points earned across all contests that month. Tie-breakers are total score, then penalty (lower is better).',
  },
  {
    q: 'When are prizes distributed?',
    a: 'Within 7 days of the end of each month. Winners are contacted via email and must verify identity before receiving the prize.',
  },
  {
    q: 'What is my CWCL Rating?',
    a: 'Your rating starts at 800 (Beginner title) with a floor of 800. Ratings are permanent and never reset. CWCL Rating System v1.0 features 9 titles: Beginner (800), Explorer (900), Coder (1000), Specialist (1100), Expert (1250), Candidate Master (1450), Master (1650), Grandmaster (1850), and Legendary Grandmaster (2100+).',
  },
  {
    q: 'How do I ensure my results are tracked?',
    a: 'Your handle on the contest platform (HackerRank, Codeforces, etc.) must match what you entered during CWCL registration. You can update your handles from your Dashboard profile page.',
  },
  {
    q: 'How do I get certificates?',
    a: 'Certificates are auto-generated after each contest. Participation certificates go to everyone who participates; Winner and Monthly Champion certificates go to top finishers. Download them from your Dashboard.',
  },
  {
    q: 'Can I update my profile after registration?',
    a: 'Yes. You can update your bio, photo, platform handles, and social links from your Dashboard profile page at any time.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'CWCL is a Progressive Web App (PWA). You can install it on your phone directly from your browser — it works just like a native app.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="card cursor-pointer select-none h-fit"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white text-xs font-body font-medium leading-snug flex-1">{q}</h3>
        <ChevronDown
          size={14}
          className={`text-neon-cyan shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <p className="text-text-secondary text-xs leading-relaxed mt-3 pt-3 border-t border-neon-cyan/10">
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQs() {
  return (
    <div className="min-h-screen bg-midnight pt-20 pb-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <CBBLogo size={56} glow={false} />
          </div>
          <h1 className="heading-lg mb-3">FAQs</h1>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Everything you need to know before joining CWCL.
          </p>
        </div>

        {/* 2-column grid on md+, single column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {FAQS.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>

        <p className="text-center text-text-secondary/50 text-xs mt-10">
          Have more questions? Reach us at{' '}
          <a href="mailto:cbb@bvrit.ac.in" className="text-neon-cyan hover:underline">
            cbb@bvrit.ac.in
          </a>
        </p>
      </div>
    </div>
  );
}
