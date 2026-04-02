import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ProfileOnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, user, profile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    phone: '',
    company: '',
    bio: '',
    recovery_email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      username: profile.username || '',
      phone: profile.phone || '',
      company: profile.company || '',
      bio: profile.bio || '',
      recovery_email: profile.recovery_email || user.email || '',
    });
  }, [profile, user]);

  if (loading || !user || !profile) {
    return <>{children}</>;
  }

  const needsOnboarding =
    !profile.phone.trim() ||
    !profile.bio.trim() ||
    !profile.recovery_email.trim();

  if (!needsOnboarding) {
    return <>{children}</>;
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.full_name.trim()) nextErrors.full_name = 'Full name is required';
    if (!form.username.trim()) nextErrors.username = 'Username is required';
    else if (form.username.trim().length < 3) nextErrors.username = 'Min 3 characters';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
    if (!form.bio.trim()) nextErrors.bio = 'Bio is required';
    if (!form.recovery_email.trim()) nextErrors.recovery_email = 'Recovery email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recovery_email.trim())) nextErrors.recovery_email = 'Invalid email format';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setServerError('');

    const { error } = await updateProfile({
      full_name: form.full_name.trim(),
      username: form.username.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      bio: form.bio.trim(),
      recovery_email: form.recovery_email.trim().toLowerCase(),
    });

    if (error) {
      setServerError(error);
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur sm:p-8">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Complete Profile
          </div>
          <h1 className="mt-5 text-3xl font-black text-white sm:text-4xl">Finish your bio data before continuing.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-200/65">
            We need your profile details and a recovery email so OTP password reset codes can be delivered if you forget your password.
          </p>
        </div>

        {serverError && (
          <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200/75">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, full_name: event.target.value }));
                  setErrors((prev) => ({ ...prev, full_name: '' }));
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-white outline-none transition-all ${errors.full_name ? 'border-rose-400 bg-rose-500/10' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'}`}
              />
              {errors.full_name && <p className="ml-1 mt-1 text-xs text-rose-400">{errors.full_name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200/75">Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, username: event.target.value }));
                  setErrors((prev) => ({ ...prev, username: '' }));
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-white outline-none transition-all ${errors.username ? 'border-rose-400 bg-rose-500/10' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'}`}
              />
              {errors.username && <p className="ml-1 mt-1 text-xs text-rose-400">{errors.username}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200/75">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, phone: event.target.value }));
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-white outline-none transition-all ${errors.phone ? 'border-rose-400 bg-rose-500/10' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'}`}
                placeholder="+254 700 000 000"
              />
              {errors.phone && <p className="ml-1 mt-1 text-xs text-rose-400">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200/75">Company / School</label>
              <input
                type="text"
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-cyan-500/50"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-blue-200/75">Recovery Email for OTP *</label>
            <input
              type="email"
              value={form.recovery_email}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, recovery_email: event.target.value }));
                setErrors((prev) => ({ ...prev, recovery_email: '' }));
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-white outline-none transition-all ${errors.recovery_email ? 'border-rose-400 bg-rose-500/10' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'}`}
              placeholder="recovery@example.com"
            />
            {errors.recovery_email && <p className="ml-1 mt-1 text-xs text-rose-400">{errors.recovery_email}</p>}
            <p className="ml-1 mt-1 text-xs text-blue-200/45">Password reset OTP codes will be sent to this address.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-blue-200/75">Short Bio *</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, bio: event.target.value }));
                setErrors((prev) => ({ ...prev, bio: '' }));
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-white outline-none transition-all ${errors.bio ? 'border-rose-400 bg-rose-500/10' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'}`}
              placeholder="Tell us a little about your background, interests, or goals."
            />
            {errors.bio && <p className="ml-1 mt-1 text-xs text-rose-400">{errors.bio}</p>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-200/70">
            Account email: <span className="font-semibold text-white">{user.email}</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving profile...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileOnboardingGate;
