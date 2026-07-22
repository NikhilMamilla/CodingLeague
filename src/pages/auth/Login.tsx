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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const [view,    setView]    = useState<View>('login');
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  // ── Email + Password login ──
  async function handleLogin() {
    if (!email.trim())    { toast.error('Enter your email');    return; }
    if (!password.trim()) { toast.error('Enter your password'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.message ?? 'Login failed';
      toast.error(msg);
    } finally { setLoading(false); }
  }

  // ── Google login ──
  async function handleGoogleLogin() {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message ?? 'Google sign-in failed');
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
    <div className="min-h-screen bg-midnight bg-grid flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">

        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-text-secondary/60 hover:text-neon-cyan text-xs font-body transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Home
        </Link>

        {/* Logo + header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CBBLogo size={64} glow={false} />
          </div>
          <h1 className="heading-sm mb-1">
            {view === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h1>
          <p className="text-text-secondary text-xs">
            {view === 'login' ? 'Sign in to your CWCL account' : 'We\'ll send a reset link to your email'}
          </p>
        </div>

        {/* ── LOGIN VIEW ── */}
        {view === 'login' && (
          <div className="card-glow space-y-4">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-body py-3 rounded-lg transition-all disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neon-cyan/10" />
              <span className="text-text-secondary/50 text-xs">or</span>
              <div className="flex-1 h-px bg-neon-cyan/10" />
            </div>

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
          <div className="card-glow space-y-4">
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
