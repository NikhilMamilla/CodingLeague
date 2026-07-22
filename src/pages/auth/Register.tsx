import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, EyeOff, ArrowLeft, Code2, ExternalLink } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getTierFromRating } from '../../types';
import CBBLogo from '../../components/ui/CBBLogo';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

interface FormData {
  // Step 1
  fullName: string; email: string; password: string; phone: string;
  // Step 2
  college: string; university: string; year: string; branch: string;
  city: string; state: string;
  // Step 3
  codeforcesHandle: string;
  leetcodeUsername: string;
  codechefUsername: string;
  hackerrankUsername: string;
  gfgUsername: string;
  acceptRules: boolean; acceptPrivacy: boolean;
}

const INITIAL: FormData = {
  fullName: '', email: '', password: '', phone: '',
  college: '', university: '', year: '', branch: '', city: '', state: '',
  codeforcesHandle: '',
  leetcodeUsername: '',
  codechefUsername: '',
  hackerrankUsername: '',
  gfgUsername: '',
  acceptRules: false, acceptPrivacy: false,
};

const YEARS    = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'AI&ML', 'Other'];

// Platform metadata
// Users paste their full profile URL (e.g. https://www.hackerrank.com/profile/NikhilMamilla)
const PLATFORMS = [
  {
    key: 'hackerrankUsername' as keyof FormData,
    label: 'HackerRank',
    placeholder: 'https://www.hackerrank.com/profile/NikhilMamilla',
    required: true,
    color: '#00EA64',
  },
  {
    key: 'codechefUsername' as keyof FormData,
    label: 'CodeChef',
    placeholder: 'https://www.codechef.com/users/nikhil_mamilla',
    required: true,
    color: '#7B4F2E',
  },
  {
    key: 'leetcodeUsername' as keyof FormData,
    label: 'LeetCode',
    placeholder: 'https://leetcode.com/u/NikhilMamilla',
    required: true,
    color: '#FFA116',
  },
  {
    key: 'codeforcesHandle' as keyof FormData,
    label: 'Codeforces',
    placeholder: 'https://codeforces.com/profile/tourist',
    required: false,
    color: '#1890FF',
  },
  {
    key: 'gfgUsername' as keyof FormData,
    label: 'GeeksforGeeks',
    placeholder: 'https://www.geeksforgeeks.org/user/nikhilmamilla',
    required: false,
    color: '#2F8D46',
  },
] as const;

/** Validate that the value is a proper https:// URL */
function isValidUrl(v: string) {
  try { return new URL(v).protocol === 'https:'; }
  catch { return false; }
}

async function generateParticipantId(): Promise<string> {
  try {
    const q = query(collection(db, 'participants'), orderBy('participantId', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return 'CBB000001';
    const last = snap.docs[0].data().participantId as string;
    if (!last || !last.startsWith('CBB')) return 'CBB000001';
    const num = parseInt(last.replace('CBB', ''), 10);
    if (isNaN(num)) return 'CBB000001';
    return 'CBB' + String(num + 1).padStart(6, '0');
  } catch {
    // Fallback: use timestamp-based ID if Firestore index is missing
    const ts = Date.now().toString().slice(-6);
    return 'CBB' + ts;
  }
}

function StepDot({ n, current }: { n: number; current: number }) {
  const done   = current > n;
  const active = current === n;
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-all duration-300
      ${done   ? 'bg-neon-cyan text-midnight scale-110' :
        active ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan' :
                 'bg-card-dark border border-neon-cyan/20 text-text-secondary'}`}>
      {done ? '✓' : n}
    </div>
  );
}

export default function Register() {
  const [step,    setStep]    = useState<Step>(1);
  const [form,    setForm]    = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  function set(field: keyof FormData, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function validateStep1() {
    if (!form.fullName.trim())  { toast.error('Full name is required');   return false; }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { toast.error('Valid email required'); return false; }
    if (!form.password || form.password.length < 6) { toast.error('Password: min 6 characters'); return false; }
    if (!form.phone.trim())     { toast.error('Phone is required');       return false; }
    return true;
  }

  function validateStep2() {
    const req: (keyof FormData)[] = ['college', 'university', 'year', 'branch', 'city', 'state'];
    for (const f of req) {
      if (!form[f]) { toast.error(`${f.charAt(0).toUpperCase() + f.slice(1)} is required`); return false; }
    }
    return true;
  }

  function validateStep3() {
    if (!form.hackerrankUsername.trim()) { toast.error('HackerRank profile URL is required');  return false; }
    if (!isValidUrl(form.hackerrankUsername)) { toast.error('HackerRank: enter a valid https:// URL'); return false; }
    if (!form.codechefUsername.trim())   { toast.error('CodeChef profile URL is required');    return false; }
    if (!isValidUrl(form.codechefUsername))   { toast.error('CodeChef: enter a valid https:// URL');   return false; }
    if (!form.leetcodeUsername.trim())   { toast.error('LeetCode profile URL is required');    return false; }
    if (!isValidUrl(form.leetcodeUsername))   { toast.error('LeetCode: enter a valid https:// URL');   return false; }
    // Optional fields — if filled, must be valid URLs
    if (form.codeforcesHandle.trim() && !isValidUrl(form.codeforcesHandle)) {
      toast.error('Codeforces: enter a valid https:// URL'); return false;
    }
    if (form.gfgUsername.trim() && !isValidUrl(form.gfgUsername)) {
      toast.error('GeeksforGeeks: enter a valid https:// URL'); return false;
    }
    if (!form.acceptRules)   { toast.error('Accept the Rules to continue');                 return false; }
    if (!form.acceptPrivacy) { toast.error('Accept the Privacy Policy to continue');        return false; }
    return true;
  }

  async function handleSubmit() {
    if (!validateStep3()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.fullName });
      const participantId = await generateParticipantId();
      await setDoc(doc(db, 'participants', cred.user.uid), {
        uid: cred.user.uid, participantId,
        fullName: form.fullName, email: form.email, phone: form.phone,
        college: form.college, university: form.university, year: form.year,
        branch: form.branch, city: form.city, state: form.state,
        // Competitive profiles
        hackerrankUsername: form.hackerrankUsername,
        codechefUsername:   form.codechefUsername,
        leetcodeUsername:   form.leetcodeUsername,
        codeforcesHandle:   form.codeforcesHandle   || null,
        gfgUsername:        form.gfgUsername         || null,
        // Social links
        github:   null,
        linkedin: null,
        // Meta
        photoURL: null, bio: null,
        rating: 800, tier: getTierFromRating(800),
        role: 'participant', badges: [],
        contestsParticipated: 0, attendance: 0,
        createdAt: new Date().toISOString(), emailVerified: false,
      });
      toast.success(`Welcome ${form.fullName}! Your ID: ${participantId}`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message ?? 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-midnight bg-grid flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg">

        <Link to="/" className="inline-flex items-center gap-1.5 text-text-secondary/60 hover:text-neon-cyan text-xs font-body transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Home
        </Link>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <CBBLogo size={60} glow={false} />
          </div>
          <h1 className="heading-sm mb-1">Join CWCL '26–27</h1>
          <p className="text-text-secondary text-xs">One registration. A full year of competitive coding.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StepDot n={1} current={step} />
          <div className={`h-px w-10 transition-colors duration-300 ${step > 1 ? 'bg-neon-cyan' : 'bg-neon-cyan/20'}`} />
          <StepDot n={2} current={step} />
          <div className={`h-px w-10 transition-colors duration-300 ${step > 2 ? 'bg-neon-cyan' : 'bg-neon-cyan/20'}`} />
          <StepDot n={3} current={step} />
        </div>

        <div className="card-glow">

          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="heading-sm text-sm mb-1">Personal Information</h2>
              <div>
                <label className="input-label">Full Name *</label>
                <input className="input-field" placeholder="Your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Email Address *</label>
                <input className="input-field" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                <p className="text-[10px] text-text-secondary/70 mt-1.5 leading-relaxed">
                  Please use your college Email ID. This helps keep participation professional and verifiable.
                </p>
              </div>
              <div>
                <label className="input-label">Password *</label>
                <div className="relative">
                  <input className="input-field pr-10" type={showPwd ? 'text' : 'password'}
                    placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="input-label">Phone Number *</label>
                <input className="input-field" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <button onClick={() => validateStep1() && setStep(2)} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                Continue <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* ── Step 2: Academic ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="heading-sm text-sm mb-1">Academic Information</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">College *</label>
                  <input className="input-field" placeholder="BVRIT" value={form.college} onChange={e => set('college', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">University *</label>
                  <input className="input-field" placeholder="JNTUH" value={form.university} onChange={e => set('university', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Year *</label>
                  <select className="input-field" value={form.year} onChange={e => set('year', e.target.value)}>
                    <option value="">Select</option>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Branch *</label>
                  <select className="input-field" value={form.branch} onChange={e => set('branch', e.target.value)}>
                    <option value="">Select</option>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">City *</label>
                  <input className="input-field" placeholder="Hyderabad" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">State *</label>
                  <input className="input-field" placeholder="Telangana" value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 text-xs">Back</button>
                <button onClick={() => validateStep2() && setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs">
                  Continue <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Competitive Profiles ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Code2 size={15} className="text-neon-cyan" />
                <h2 className="heading-sm text-sm">Competitive Profiles</h2>
              </div>

              {/* Mandatory note */}
              <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg px-3 py-2.5 space-y-1">
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="text-neon-cyan font-semibold">HackerRank, CodeChef & LeetCode</span> are mandatory.
                  Codeforces and GFG are optional.
                </p>
                <p className="text-[11px] text-text-secondary/60 leading-relaxed">
                  Paste your <span className="text-white/70">full profile URL</span> including{' '}
                  <code className="bg-white/10 px-1 rounded text-neon-cyan/80">https://</code>
                  {' '}— e.g.{' '}
                  <span className="text-white/50">https://www.hackerrank.com/profile/NikhilMamilla</span>
                </p>
              </div>

              {/* Platform rows */}
              <div className="space-y-3">
                {PLATFORMS.map(p => {
                  const val = form[p.key] as string;
                  const validUrl = isValidUrl(val.trim());
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="input-label flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.label}
                          {p.required
                            ? <span className="text-red-400 ml-0.5">*</span>
                            : <span className="text-text-secondary/50 text-[10px] ml-1">(optional)</span>
                          }
                        </label>
                        {validUrl && (
                          <a
                            href={val.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-neon-cyan/70 hover:text-neon-cyan flex items-center gap-0.5 transition-colors"
                          >
                            verify <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <input
                        className="input-field text-xs"
                        placeholder={p.placeholder}
                        value={val}
                        onChange={e => set(p.key, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Checkboxes */}
              <div className="space-y-2.5 pt-1 border-t border-white/5">
                <label className="flex items-start gap-2.5 cursor-pointer mt-3">
                  <input type="checkbox" checked={form.acceptRules} onChange={e => set('acceptRules', e.target.checked)} className="mt-0.5 accent-[#00E5FF]" />
                  <span className="text-text-secondary text-xs leading-relaxed">
                    I accept the{' '}
                    <Link to="/rules" target="_blank" className="text-neon-cyan hover:underline">Contest Rules</Link>{' '}
                    and agree to participate fairly.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.acceptPrivacy} onChange={e => set('acceptPrivacy', e.target.checked)} className="mt-0.5 accent-[#00E5FF]" />
                  <span className="text-text-secondary text-xs leading-relaxed">
                    I accept the{' '}
                    <Link to="/rules" target="_blank" className="text-neon-cyan hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 text-xs">Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="btn-primary flex-1 text-xs disabled:opacity-50">
                  {loading ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-text-secondary text-xs mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-neon-cyan hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
