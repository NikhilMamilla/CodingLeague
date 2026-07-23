import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import CBBLogo from '../../components/ui/CBBLogo';
import toast from 'react-hot-toast';

type View = 'login' | 'forgot';

export default function Login() {
  const [view,    setView]    = useState<View>('login');
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return; // wait for auth+firestore to settle
    if (user && role) navigate(role === 'admin' || role === 'super_admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, role, authLoading]);

  // ── Email + Password login ──
  async function handleLogin() {
    if (!email.trim())    { toast.error('Enter your email');    return; }
    if (!password.trim()) { toast.error('Enter your password'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // redirect handled by useEffect watching role
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.message ?? 'Login failed';
      toast.error(msg);
    } finally { setLoading(false); }
  }

  // ── Forgot password ──
  async function handleForgotPassword() {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Enter a valid email address first'); return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send reset email');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-midnight bg-grid px-4 py-6 sm:px-6 sm:py-10">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-56 h-56 sm:w-80 sm:h-80 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto flex w-full max-w-[420px] flex-col">

        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-1.5 self-start text-text-secondary/60 hover:text-neon-cyan text-xs font-body transition-colors mb-5 sm:mb-6">
          <ArrowLeft size={13} /> Back to Home
        </Link>

        {/* Logo + header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <CBBLogo size={64} glow={false} />
          </div>
          <h1 className="heading-sm mb-1">
            {view === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h1>
          <p className="text-text-secondary text-xs leading-relaxed px-2">
            {view === 'login' ? 'Sign in to your CWCL account' : 'We\'ll send a reset link to your email'}
          </p>
        </div>

        {/* ── LOGIN VIEW ── */}
        {view === 'login' && (
          <div className="card-glow space-y-3 sm:space-y-4 p-4 sm:p-5">
            {/* Email */}
            <div>
              <label className="input-label">Email Address</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <p className="text-[10px] text-text-secondary/70 mt-1.5 leading-relaxed">
                Please use your college email ID
              </p>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-neon-cyan/70 hover:text-neon-cyan text-[10px] font-body transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  className="input-field pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        )}

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === 'forgot' && (
          <div className="card-glow space-y-3 sm:space-y-4 p-4 sm:p-5">
            {!resetSent ? (
              <>
                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                  />
                  <p className="text-text-secondary/50 text-[10px] mt-1.5">
                    Enter the email you used to register.
                  </p>
                </div>
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Mail size={13} />
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  onClick={() => setView('login')}
                  className="btn-ghost w-full text-xs"
                >
                  Back to Login
                </button>
              </>
            ) : (
              <div className="text-center space-y-3 py-2">
                <div className="w-12 h-12 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto">
                  <Mail size={20} className="text-success" />
                </div>
                <p className="text-white text-sm font-body">Reset link sent!</p>
                <p className="text-neon-cyan text-xs font-numbers">{email}</p>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Check your inbox (and spam). Click the link to set a new password.
                </p>
                <button onClick={() => { setView('login'); setResetSent(false); }} className="btn-primary w-full text-xs">
                  Back to Login
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-text-secondary text-xs mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-neon-cyan hover:underline">Register for CWCL</Link>
        </p>
      </div>
    </div>
  );
}
