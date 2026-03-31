import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, getErrorMessage, type CreateConsultationPayload } from '@/lib/api';

const serviceOptions = [
  'Computer Systems', 'Computer Architecture', 'IT Support & Customer Care',
  'Operating Systems', 'System Analysis & Design', 'Digital Electronics',
  'Programming Fundamentals', 'Web-Based Programming', 'OO Analysis & Design',
  'OO Programming', 'Data Structures & Algorithms', 'Software System Project',
  'Database Systems', 'Data Communications & Networks', 'Distributed Systems',
  'E-Systems & E-Commerce', 'Techno-Entrepreneurship', 'Business Management',
  'Research Methods in CS', 'Seminar & Report Writing',
];

const ConsultationForm: React.FC = () => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', service: '', message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Pre-fill form with user data
  React.useEffect(() => {
    if (user && profile) {
      setForm(prev => ({
        ...prev,
        name: prev.name || profile.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || profile.phone || '',
      }));
    }
  }, [user, profile]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.service) newErrors.service = 'Please select a service';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const consultationData: CreateConsultationPayload = {
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        message: form.message,
        status: 'pending',
      };

      await api.createConsultation(consultationData);
      setSubmitted(true);
    } catch (err: unknown) {
      console.error('Consultation submit error:', err);
      setSubmitError(getErrorMessage(err, 'Could not send your consultation right now.'));
    }

    setIsSubmitting(false);
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (submitError) setSubmitError('');
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-[#0a1628] to-[#0f1d35] relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left - Info */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
              <span className="text-cyan-300 text-sm font-medium">Get In Touch</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Ready to <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Transform</span> Your Business?
            </h2>
            <p className="text-blue-200/60 text-lg mb-10 leading-relaxed">
              Let's discuss how our expert tech solutions can help you achieve your goals. Fill out the form and we'll get back to you within 24 hours.
            </p>

            {user && (
              <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Signed in as {profile?.full_name || user.email}</p>
                  <p className="text-blue-200/40 text-xs">Your consultation will be saved to your dashboard</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <p className="text-white font-bold">Phone</p>
                  <p className="text-blue-200/60 text-sm">0757 152 440</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <div>
                  <p className="text-white font-bold">Email</p>
                  <p className="text-blue-200/60 text-sm">info@kcjtech.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-white font-bold">Location</p>
                  <p className="text-blue-200/60 text-sm">Nairobi, Kenya</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-blue-200/60 mb-6">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                {user && <p className="text-cyan-400/60 text-sm mb-4">View your consultation history in your dashboard.</p>}
                <button onClick={() => { setSubmitted(false); setForm({ name: profile?.full_name || '', email: user?.email || '', phone: profile?.phone || '', service: '', message: '' }); }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-bold text-white mb-2">Book a Free Consultation</h3>
                <p className="text-blue-200/50 text-sm mb-6">Fill out the form below and we'll reach out to discuss your needs.</p>

                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                    {submitError}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Full Name *</label>
                    <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/5 border ${errors.name ? 'border-red-400' : 'border-white/10'} rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all`}
                      placeholder="John Doe" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Email *</label>
                    <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/5 border ${errors.email ? 'border-red-400' : 'border-white/10'} rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all`}
                      placeholder="john@example.com" />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Phone (Optional)</label>
                    <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all"
                      placeholder="+254 700 000 000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Service *</label>
                    <select value={form.service} onChange={e => handleChange('service', e.target.value)}
                      className={`w-full px-4 py-3 bg-white/5 border ${errors.service ? 'border-red-400' : 'border-white/10'} rounded-xl text-white focus:border-cyan-500/50 outline-none transition-all appearance-none cursor-pointer`}>
                      <option value="" className="bg-[#0a1628]">Select a service</option>
                      {serviceOptions.map(s => (
                        <option key={s} value={s} className="bg-[#0a1628]">{s}</option>
                      ))}
                    </select>
                    {errors.service && <p className="text-red-400 text-xs mt-1">{errors.service}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={e => handleChange('message', e.target.value)} rows={4}
                    className={`w-full px-4 py-3 bg-white/5 border ${errors.message ? 'border-red-400' : 'border-white/10'} rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all resize-none`}
                    placeholder="Tell us about your project or requirements..." />
                  {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsultationForm;
