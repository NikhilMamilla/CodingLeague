import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, EyeOff, ArrowLeft, Code2, ExternalLink, CheckCircle2, XCircle, Loader2, Send, Crown } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getTierFromRating } from '../../types';
import CBBLogo from '../../components/ui/CBBLogo';
import FoundingMemberBadge from '../../components/ui/FoundingMemberBadge';
import type { FoundingReservation } from '../../lib/foundingMembers';
import toast from 'react-hot-toast';
import { extractHandle, verifyPlatformProfile, type VerificationResult } from '../../lib/profileVerification';
import { upsertParticipant, getSetting } from '../../lib/db';
import { supabase } from '../../lib/supabase';

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

const PLATFORMS = [
  {
    key: 'hackerrankUsername' as keyof FormData,
    label: 'HackerRank',
    placeholder: 'https://www.hackerrank.com/profile/NikhilMamilla or username',
    required: true,
    color: '#00EA64',
  },
  {
    key: 'codechefUsername' as keyof FormData,
    label: 'CodeChef',
    placeholder: 'https://www.codechef.com/users/nikhil_mamilla or username',
    required: true,
    color: '#7B4F2E',
  },
  {
    key: 'leetcodeUsername' as keyof FormData,
    label: 'LeetCode',
    placeholder: 'https://leetcode.com/u/NikhilMamilla or username',
    required: true,
    color: '#FFA116',
  },
  {
    key: 'codeforcesHandle' as keyof FormData,
    label: 'Codeforces',
    placeholder: 'https://codeforces.com/profile/tourist or handle',
    required: false,
    color: '#1890FF',
  },
  {
    key: 'gfgUsername' as keyof FormData,
    label: 'GeeksforGeeks',
    placeholder: 'https://www.geeksforgeeks.org/user/nikhilmamilla or username',
    required: false,
    color: '#2F8D46',
  },
] as const;

async function generateParticipantId(): Promise<string> {
  // Read the actual max from participants — still a plain SELECT, still
  // allowed for everyone. The write is the part that changed: counters can
  // only be written by admins now (see supabase/migrations/0002), so the
  // increment goes through next_counter(), a SECURITY DEFINER RPC that takes
  // this value as a floor and does the read-check-write atomically server
  // side. That also closes a pre-existing race: two signups landing on the
  // same ID was possible with the old read-then-write-from-the-browser code.
  const { data: maxRow } = await supabase
    .from('participants')
    .select('participant_id')
    .order('participant_id', { ascending: false })
    .limit(1)
    .maybeSingle();
  const existingMax = maxRow?.participant_id
    ? parseInt((maxRow.participant_id as string).replace(/\D/g, ''), 10)
    : 0;

  const { data: next, error } = await supabase.rpc('next_counter', {
    counter_id: 'participant_id',
    min_floor: existingMax,
  });
  if (error) throw new Error(error.message);

  return 'CBB' + String(next).padStart(6, '0');
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
  const [step,          setStep]          = useState<Step>(1);
  const [form,          setForm]          = useState<FormData>(INITIAL);
  const [loading,       setLoading]       = useState(false);
  const [showPwd,       setShowPwd]       = useState(false);
  const [verifyingMap,  setVerifyingMap]  = useState<Record<string, boolean>>({});
  const [verifyResults, setVerifyResults] = useState<Record<string, VerificationResult>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFoundingModal, setShowFoundingModal] = useState(false);
  const [foundingData, setFoundingData] = useState<FoundingReservation | null>(null);
  const [whatsappLink, setWhatsappLink] = useState('');
  const navigate = useNavigate();

  function set(field: keyof FormData, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
    // Reset verification result if field value changes
    if (typeof value === 'string' && verifyResults[field]) {
      setVerifyResults(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleVerify(key: string, val: string) {
    if (!val.trim()) {
      toast.error('Please enter a handle or profile URL first');
      return;
    }
    setVerifyingMap(prev => ({ ...prev, [key]: true }));
    try {
      const res = await verifyPlatformProfile(key, val);
      setVerifyResults(prev => ({ ...prev, [key]: res }));
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Verification request failed');
    } finally {
      setVerifyingMap(prev => ({ ...prev, [key]: false }));
    }
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

  async function validateStep3(): Promise<boolean> {
    if (!form.hackerrankUsername.trim()) { toast.error('HackerRank handle or URL is required');  return false; }
    if (!form.codechefUsername.trim())   { toast.error('CodeChef handle or URL is required');    return false; }
    if (!form.leetcodeUsername.trim())   { toast.error('LeetCode handle or URL is required');    return false; }

    if (!form.acceptRules)   { toast.error('Accept the Rules to continue');                 return false; }
    if (!form.acceptPrivacy) { toast.error('Accept the Privacy Policy to continue');        return false; }

    // Check real-time verification for all non-empty fields
    const toVerify = PLATFORMS.filter(p => (form[p.key] as string).trim());
    let allValid = true;

    for (const p of toVerify) {
      const val = form[p.key] as string;
      let existingRes = verifyResults[p.key];

      if (!existingRes || !existingRes.success) {
        setVerifyingMap(prev => ({ ...prev, [p.key]: true }));
        const res = await verifyPlatformProfile(p.key, val);
        setVerifyResults(prev => ({ ...prev, [p.key]: res }));
        setVerifyingMap(prev => ({ ...prev, [p.key]: false }));

        if (!res.success) {
          if (p.required) {
            toast.error(`Verification failed for ${p.label}: ${res.message}`);
            allValid = false;
          }
        }
      }
    }

    return allValid;
  }

  async function handleSubmit() {
    const valid = await validateStep3();
    if (!valid) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.fullName });
      const participantId = await generateParticipantId();

      // Extract clean handles for sync
      const hrHandle = extractHandle('hackerrankUsername', form.hackerrankUsername);
      const ccHandle = extractHandle('codechefUsername',   form.codechefUsername);
      const lcHandle = extractHandle('leetcodeUsername',   form.leetcodeUsername);
      const cfHandle = form.codeforcesHandle ? extractHandle('codeforcesHandle', form.codeforcesHandle) : null;
      const gfgHandle= form.gfgUsername      ? extractHandle('gfgUsername',        form.gfgUsername)      : null;

      const participantDoc: any = {
        uid: cred.user.uid, participantId,
        fullName: form.fullName, email: form.email, phone: form.phone,
        college: form.college, university: form.university, year: form.year,
        branch: form.branch, city: form.city, state: form.state,
        // Competitive handles stored clean for 100% sync matching
        hackerrankUsername: hrHandle,
        codechefUsername:   ccHandle,
        leetcodeUsername:   lcHandle,
        codeforcesHandle:   cfHandle,
        gfgUsername:        gfgHandle,
        // Raw URLs saved for direct link access
        hackerrankUrl:      verifyResults['hackerrankUsername']?.formattedUrl || `https://www.hackerrank.com/profile/${hrHandle}`,
        codechefUrl:        verifyResults['codechefUsername']?.formattedUrl   || `https://www.codechef.com/users/${ccHandle}`,
        leetcodeUrl:        verifyResults['leetcodeUsername']?.formattedUrl   || `https://leetcode.com/u/${lcHandle}`,
        codeforcesUrl:      cfHandle ? (verifyResults['codeforcesHandle']?.formattedUrl || `https://codeforces.com/profile/${cfHandle}`) : null,
        gfgUrl:             gfgHandle ? (verifyResults['gfgUsername']?.formattedUrl || `https://www.geeksforgeeks.org/user/${gfgHandle}`) : null,
        // Social links
        github:   null,
        linkedin: null,
        // Meta
        photoURL: null, bio: null,
        rating: 800, tier: getTierFromRating(800),
        role: 'participant',
        contestsParticipated: 0, attendance: 0,
        createdAt: new Date().toISOString(), emailVerified: false,
        foundingMember: false, badges: [],
      };

      // participants_guard (supabase/migrations/0002) forces role, rating,
      // badges, and the founding_* columns to these same defaults on INSERT
      // regardless of what's sent — a fresh signup cannot hand itself
      // privileges or a founding-member slot. Founding-member status, if any,
      // is claimed below via an RPC once the row exists.
      await upsertParticipant({ uid: cred.user.uid, ...participantDoc });

      // Must run after the insert above — claim_founding_member() (supabase/
      // migrations/0003) stamps an *existing* participants row; it can't
      // reserve a slot for a row that isn't there yet. Returns null when the
      // program is off, past its cutoff, or full.
      let foundingReservation: FoundingReservation | null = null;
      try {
        const { data } = await supabase.rpc('claim_founding_member');
        if (data) {
          foundingReservation = { rank: data.rank, seasonId: data.seasonId, seasonLabel: data.seasonLabel };
        }
      } catch { /* founding member program unavailable — proceed without it */ }

      toast.success(`Welcome ${form.fullName}! Your ID: ${participantId}`);
      // Small delay to allow AuthContext to refetch the new participant row
      await new Promise(r => setTimeout(r, 500));

      // Create notification announcement for founding members
      if (foundingReservation) {
        try {
          await supabase.rpc('announce_founding_member', { p_season_id: foundingReservation.seasonId });
        } catch { /* ignore */ }
        setFoundingData(foundingReservation);
        setShowFoundingModal(true);
        return;
      }

      // Fetch WhatsApp link and show success modal
      try {
        const commData = await getSetting('community');
        if (commData?.announcementWhatsapp) setWhatsappLink(commData.announcementWhatsapp);
      } catch { /* ignore */ }
      setShowSuccessModal(true);
    } catch (err: any) {
      // If Supabase profile write failed after Firebase account was created, delete the orphaned auth account
      if (err.message && !(err.message.includes('email') || err.message.includes('password'))) {
        try {
          const { getAuth } = await import('firebase/auth');
          const currentUser = getAuth().currentUser;
          if (currentUser) await currentUser.delete();
        } catch { /* ignore cleanup errors */ }
      }
      toast.error(err.message ?? 'Registration failed');
    } finally { setLoading(false); }
  }

  return (<>
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
                  Enter your <span className="text-white/70">handle/username</span> or <span className="text-white/70">full profile URL</span>. Click <span className="text-neon-cyan font-semibold">Verify</span> to perform real-time verification.
                </p>
              </div>

              {/* Platform rows */}
              <div className="space-y-3">
                {PLATFORMS.map(p => {
                  const val = form[p.key] as string;
                  const isVerifying = verifyingMap[p.key];
                  const res = verifyResults[p.key];
                  const clean = extractHandle(p.key, val);

                  return (
                    <div key={p.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="input-label flex items-center gap-1.5 mb-0">
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

                        {val.trim() && (
                          <div className="flex items-center gap-2">
                            {res?.formattedUrl && (
                              <a
                                href={res.formattedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-text-secondary hover:text-neon-cyan flex items-center gap-0.5"
                                title="Open Profile Link"
                              >
                                View <ExternalLink size={10} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleVerify(p.key, val)}
                              disabled={isVerifying}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                              {isVerifying ? (
                                <>
                                  <Loader2 size={10} className="animate-spin" /> Verifying…
                                </>
                              ) : res?.success ? (
                                <>
                                  <CheckCircle2 size={10} className="text-success" /> Verified
                                </>
                              ) : res ? (
                                <>
                                  <XCircle size={10} className="text-red-400" /> Re-verify
                                </>
                              ) : (
                                'Verify Real-Time'
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <input
                        className={`input-field text-xs transition-colors ${
                          res?.success ? 'border-success/50 bg-success/5' : res ? 'border-red-400/50 bg-red-400/5' : ''
                        }`}
                        placeholder={p.placeholder}
                        value={val}
                        onChange={e => set(p.key, e.target.value)}
                      />

                      {/* Real-Time verification feedback message */}
                      {res && (
                        <div className={`text-[11px] flex items-center gap-1 px-1 ${
                          res.success ? 'text-success' : 'text-red-400'
                        }`}>
                          {res.success ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{res.message}</span>
                          {clean && res.success && (
                            <span className="text-text-secondary/70 text-[10px] ml-1">(Handle: @{clean})</span>
                          )}
                        </div>
                      )}
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
                  {loading ? 'Verifying & Creating…' : 'Create Account'}
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

    {/* ── Founding Member Welcome Modal ── */}
    {showFoundingModal && foundingData && (
      <div className="fixed inset-0 z-50 bg-midnight/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => { setShowFoundingModal(false); navigate('/dashboard'); }}>
        <div className="bg-[#0a1628] border border-gold/30 rounded-2xl w-full max-w-md p-8 text-center"
          onClick={e => e.stopPropagation()}>
          <FoundingMemberBadge size={180} />
          <div className="mt-4 mb-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold">
              <Crown size={12} /> Founding Member #{foundingData.rank}
            </span>
          </div>
          <h2 className="heading-sm mt-5 mb-2 text-gold">Congratulations!</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            You are officially one of the Founding Members of the inaugural CBB Weekly Coding League (CWCL) {foundingData.seasonLabel}.
            You have received an exclusive Founding Member Badge and Recognition Certificate.
          </p>
          <div className="space-y-3">
            <FoundingMemberBadge size={160} downloadable />
            <button
              onClick={() => { setShowFoundingModal(false); navigate('/dashboard'); }}
              className="btn-primary w-full text-xs"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Post-Registration Success Modal ── */}
    {showSuccessModal && (
      <div className="fixed inset-0 z-50 bg-midnight/85 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => { setShowSuccessModal(false); navigate('/dashboard'); }}>
        <div className="bg-[#0a1628] border border-neon-cyan/25 rounded-2xl w-full max-w-md p-8 text-center"
          onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/40 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-neon-cyan" />
          </div>
          <h2 className="heading-sm mb-2">Registration Successful</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            Welcome to the CBB Weekly Coding League. To receive contest updates and announcements, join our official WhatsApp Announcement Community.
          </p>
          <div className="space-y-3">
            {whatsappLink && (
              <a
                href={whatsappLink} target="_blank" rel="noopener noreferrer"
                onClick={() => { setTimeout(() => navigate('/dashboard'), 500); }}
                className="btn-primary w-full flex items-center justify-center gap-2 text-xs"
              >
                <Send size={13} /> Join Now
              </a>
            )}
            <button
              onClick={() => { setShowSuccessModal(false); navigate('/dashboard'); }}
              className={`w-full text-xs py-3 rounded-lg font-heading font-bold uppercase tracking-widest transition-all ${whatsappLink ? 'btn-secondary' : 'btn-primary'}`}
            >
              Go to Dashboard
            </button>
          </div>
          <p className="text-[10px] text-text-secondary/50 mt-4">
            You can always join later from Dashboard → Community.
          </p>
        </div>
      </div>
    )}
  </>);
}

