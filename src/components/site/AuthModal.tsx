import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, getErrorMessage } from '@/lib/api';
import keithImage from '@/keith.jpg';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'modal' | 'page';
}

type AuthView = 'login' | 'signup' | 'forgot';
type ForgotStep = 'request' | 'confirm';

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  onClose,
  variant = 'modal',
}) => {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const isPage = variant === 'page';

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setFullName('');
    setOtp('');
    setForgotStep('request');
    setErrors({});
    setServerError('');
    setSuccess(null);
    setNotice(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    if (isPage) return;
    onClose?.();
  };

  const switchView = (nextView: AuthView) => {
    setView(nextView);
    resetForm();
  };

  const goToForgotRequest = () => {
    setForgotStep('request');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setServerError('');
    setSuccess(null);
    setNotice(null);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const isForgotConfirm = view === 'forgot' && forgotStep === 'confirm';

    if (view === 'signup') {
      if (!username.trim()) nextErrors.username = 'Username is required';
      else if (username.trim().length < 3) nextErrors.username = 'Min 3 characters';

      if (!fullName.trim()) nextErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Invalid email format';

    if (view === 'login' || view === 'signup' || isForgotConfirm) {
      if (!password) nextErrors.password = 'Password is required';
      else if (password.length < 6) nextErrors.password = 'Min 6 characters';
    }

    if (view === 'signup' || isForgotConfirm) {
      if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
      else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (isForgotConfirm) {
      if (!otp.trim()) nextErrors.otp = 'OTP is required';
      else if (!/^\d{6}$/.test(otp.trim())) nextErrors.otp = 'Enter the 6-digit code';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      if (view === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setServerError(error);
        } else {
          setSuccess('Login successful! Welcome back.');
          if (!isPage) {
            setTimeout(() => {
              handleClose();
              resetForm();
            }, 1200);
          }
        }
        return;
      }

      if (view === 'signup') {
        const { error } = await signUp(email, password, username, fullName);
        if (error) {
          setServerError(error);
        } else {
          setSuccess('Account created successfully! Complete your bio data next.');
          if (!isPage) {
            setTimeout(() => {
              handleClose();
              resetForm();
            }, 1400);
          }
        }
        return;
      }

      if (forgotStep === 'request') {
        const result = await api.requestPasswordReset(email);
        setForgotStep('confirm');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});

        if (result.fallback && result.otp) {
          setNotice(
            `Email is disabled. For owner account recovery, use this fallback code: ${result.otp}. Expires at ${new Date(result.expiresAt).toLocaleTimeString()}.`,
          );
        } else {
          setNotice(
            result.deliveryEmailMasked
              ? `If an account exists for ${email}, a 6-digit OTP has been sent to ${result.deliveryEmailMasked}. Enter it below and set your new password.`
              : `If an account exists for ${email}, a 6-digit OTP has been sent. Enter it below and set your new password.`,
          );
        }
        return;
      }

      await api.confirmPasswordReset({
        email,
        otp: otp.trim(),
        password,
      });

      setNotice(null);
      setSuccess('Password updated successfully. Redirecting you to sign in.');
      setTimeout(() => {
        switchView('login');
      }, 1600);
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPage && !isOpen) return null;

  const title =
    view === 'forgot'
      ? forgotStep === 'request'
        ? {
            heading: 'Reset Password',
            sub: 'Enter your email to receive a 6-digit OTP',
          }
        : {
            heading: 'Verify OTP',
            sub: `Enter the 6-digit code sent to ${email}`,
          }
      : view === 'login'
        ? { heading: 'Sign in', sub: 'Continue to Tech Support Services.' }
        : { heading: 'Create account', sub: 'Set up access to Tech Support Services.' };

  const submitLabel =
    view === 'login'
      ? 'Sign In'
      : view === 'signup'
        ? 'Create Account'
        : forgotStep === 'request'
          ? 'Send OTP'
          : 'Reset Password';

  const isForgotConfirm = view === 'forgot' && forgotStep === 'confirm';
  const emailReadOnly = isForgotConfirm;

  const formCard = (
    <div className={`relative overflow-hidden rounded-[2rem] border ${isPage ? 'border-white/10 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]' : 'border-white/10 bg-white shadow-2xl'} `}>
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#102b5c_45%,#0ea5e9_100%)] px-6 py-8 text-center sm:px-8">
        {!isPage && onClose && (
          <button onClick={handleClose} className="absolute right-4 top-4 text-white/70 transition-colors hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-8 top-8 h-16 w-16 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="absolute bottom-6 right-8 h-20 w-20 rounded-full bg-blue-200/20 blur-2xl" />
        </div>
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 11h8"/><path d="M12 7v8"/></svg>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">{title.heading}</h2>
        <p className="mt-2 text-sm text-cyan-100/85">{title.sub}</p>
      </div>

      <div className="relative px-6 py-6 sm:px-8 sm:py-8">
        {success ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Success</h3>
            <p className="mt-2 text-sm text-slate-500">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverError}
              </div>
            )}

            {notice && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            {view === 'forgot' && forgotStep === 'request' && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                If email OTP delivery is unavailable, contact the owner and use Dashboard {'->'} Settings {'->'} Manual Password Reset to generate a code.
              </div>
            )}

            {view === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setErrors((previous) => ({ ...previous, username: '' }));
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition-all ${errors.username ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-sky-500 focus:bg-white'}`}
                  placeholder="Choose a username"
                />
                {errors.username && <p className="ml-1 mt-1 text-xs text-rose-500">{errors.username}</p>}
              </div>
            )}

            {view === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setErrors((previous) => ({ ...previous, fullName: '' }));
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition-all ${errors.fullName ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-sky-500 focus:bg-white'}`}
                  placeholder="Your full name"
                />
                {errors.fullName && <p className="ml-1 mt-1 text-xs text-rose-500">{errors.fullName}</p>}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                readOnly={emailReadOnly}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((previous) => ({ ...previous, email: '' }));
                  setServerError('');
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition-all ${errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-sky-500 focus:bg-white'} ${emailReadOnly ? 'cursor-not-allowed text-slate-500' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="ml-1 mt-1 text-xs text-rose-500">{errors.email}</p>}
              {isForgotConfirm && (
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">Need a new code or different email?</span>
                  <button type="button" onClick={goToForgotRequest} className="font-semibold text-sky-600 hover:text-sky-800">
                    Request another OTP
                  </button>
                </div>
              )}
            </div>

            {isForgotConfirm && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setErrors((previous) => ({ ...previous, otp: '' }));
                    setServerError('');
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 font-semibold tracking-[0.35em] text-slate-900 outline-none transition-all ${errors.otp ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-sky-500 focus:bg-white'}`}
                  placeholder="123456"
                />
                {errors.otp && <p className="ml-1 mt-1 text-xs text-rose-500">{errors.otp}</p>}
              </div>
            )}

            {(view === 'login' || view === 'signup' || isForgotConfirm) && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {isForgotConfirm ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrors((previous) => ({ ...previous, password: '' }));
                      setServerError('');
                    }}
                    className={`w-full rounded-2xl border px-4 py-3 pr-12 text-slate-900 outline-none transition-all ${errors.password ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-sky-500 focus:bg-white'}`}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="ml-1 mt-1 text-xs text-rose-500">{errors.password}</p>}
              </div>
            )}

            {(view === 'signup' || isForgotConfirm) && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setErrors((previous) => ({ ...previous, confirmPassword: '' }));
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition-all ${errors.confirmPassword ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:border-sky-500 focus:bg-white'}`}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && <p className="ml-1 mt-1 text-xs text-rose-500">{errors.confirmPassword}</p>}
              </div>
            )}

            {view === 'login' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => switchView('forgot')} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Processing...' : submitLabel}
            </button>

            <div className="space-y-1 pt-2 text-center text-sm text-slate-500">
              {view === 'login' && (
                <p>
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => switchView('signup')} className="font-semibold text-sky-600 hover:text-sky-800">
                    Create account
                  </button>
                </p>
              )}
              {view === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchView('login')} className="font-semibold text-sky-600 hover:text-sky-800">
                    Sign in
                  </button>
                </p>
              )}
              {view === 'forgot' && (
                <p>
                  Remember your password?{' '}
                  <button type="button" onClick={() => switchView('login')} className="font-semibold text-sky-600 hover:text-sky-800">
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (!isPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md" onClick={(event) => event.stopPropagation()}>
          {formCard}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf2ff]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(29,78,216,0.18),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="hidden rounded-[2.5rem] bg-[linear-gradient(160deg,#0f172a_0%,#0f2f63_42%,#38bdf8_100%)] p-10 text-white shadow-[0_40px_90px_rgba(15,23,42,0.28)] lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/90">
                Private Access
              </div>
              <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-tight">
                Sign in to Tech Support Services.
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-cyan-50/85">
                Built by KCJ Tech, this secure portal is where members log in to manage learning, support, and service activity.
              </p>
              <div className="mt-8 flex items-center gap-4 rounded-[1.75rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <img
                  src={keithImage}
                  alt="Keith Chege Junior, founder and CEO"
                  className="h-24 w-24 rounded-2xl object-cover border border-white/20 shadow-lg"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/70">Founder</p>
                  <p className="mt-1 text-2xl font-bold text-white">Keith Chege Junior</p>
                  <p className="mt-1 text-sm text-cyan-50/80">CEO, KCJ Tech</p>
                </div>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Courses', value: '10+' },
                  { label: 'Guided topics', value: '100+' },
                  { label: 'Private workspace', value: '1 login' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-5 backdrop-blur">
                    <p className="text-2xl font-black text-white">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-cyan-100/75">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <img
                src={keithImage}
                alt="Keith Chege Junior, founder and CEO"
                className="mx-auto h-20 w-20 rounded-3xl object-cover border border-slate-200 shadow-lg"
              />
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Tech Support Services</h1>
              <p className="mt-2 text-sm text-slate-600">Powered by KCJ Tech. Sign in or create an account to continue.</p>
            </div>
            {formCard}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
