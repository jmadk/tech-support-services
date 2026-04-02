import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  api,
  getErrorMessage,
  type CreateConsultationPayload,
} from '@/lib/api';
import {
  CLASS_OPTIONS,
  COMPLEXITY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  SERVICE_OPTIONS,
  formatKes,
  getComplexityLabel,
  getServicePrice,
  type PaymentMethod,
  type ServiceComplexity,
} from '@/lib/service-pricing';

type RequestType = 'service' | 'class';

const ConsultationForm: React.FC = () => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    requestType: 'service' as RequestType,
    service: '',
    complexity: 'starter' as ServiceComplexity,
    paymentMethod: 'mpesa' as PaymentMethod,
    mpesaPhone: '',
    transactionCode: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  React.useEffect(() => {
    if (user && profile) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || profile.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || profile.phone || '',
        mpesaPhone: prev.mpesaPhone || profile.phone || '',
        transactionCode: prev.transactionCode || '',
      }));
    }
  }, [user, profile]);

  const currentPrice =
    form.requestType === 'service' && form.service
      ? getServicePrice(form.service, form.complexity)
      : 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.service) newErrors.service = `Please select a ${form.requestType}`;
    if (!form.message.trim()) newErrors.message = 'Message is required';

    if (form.requestType === 'service') {
      if (!form.complexity) newErrors.complexity = 'Please select service complexity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (submitError) setSubmitError('');
  };

  const resetForm = () => {
    setForm({
      name: profile?.full_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      requestType: 'service',
      service: '',
      complexity: 'starter',
      paymentMethod: 'mpesa',
      mpesaPhone: profile?.phone || '',
      transactionCode: '',
      message: '',
    });
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

      const { consultation } = await api.createConsultation(consultationData);

      setSubmitted(true);
    } catch (err: unknown) {
      console.error('Consultation submit error:', err);
      setSubmitError(getErrorMessage(err, 'Could not send your request right now.'));
    }

    setIsSubmitting(false);
  };

  return (
    <section id="contact" className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] to-[#0f1d35] py-24">
      <div className="absolute left-1/3 top-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/3 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
              <span className="text-sm font-medium text-cyan-300">Service Requests & Consultations</span>
            </div>
            <h2 className="mb-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Start a <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">service request</span> or class inquiry
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-blue-200/60">
              Submit your request first. Admin reviews it before any payment is made, then payment instructions and approval follow in the correct order.
            </p>

            {user && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-300">Signed in as {profile?.full_name || user.email}</p>
                  <p className="text-xs text-blue-200/40">Your request history will stay attached to your dashboard account.</p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Primary Checkout</p>
                <p className="mt-3 text-2xl font-black text-white">M-Pesa STK Push</p>
                <p className="mt-2 text-sm leading-6 text-blue-200/60">
                  Clients trigger checkout directly from the site to their phone, with funds routed through the Daraja-configured business account.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Public Contact</p>
                <p className="mt-3 text-2xl font-black text-white">0757 152 440</p>
                <p className="mt-2 text-sm leading-6 text-blue-200/60">
                  This number can be used later if admin asks you to complete payment after review.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Service Focus</p>
                <p className="mt-3 text-sm leading-7 text-blue-200/60">
                  Best suited for software development, web and app development, AI and machine learning, plus the broader engineering services listed on the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            {submitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  {form.requestType === 'service' ? 'Request Submitted!' : 'Class Inquiry Sent'}
                </h3>
                <p className="mb-6 text-blue-200/60">
                  {form.requestType === 'service'
                    ? 'Your request has been sent to admin for review. Payment should only be made after admin responds with payment instructions.'
                    : "Your class inquiry has been recorded. We'll follow up after admin review."}
                </p>
                {user && <p className="mb-4 text-sm text-cyan-400/60">View your consultation history in your dashboard.</p>}
                <button
                  onClick={() => {
                    setSubmitted(false);
                    resetForm();
                  }}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-bold text-white transition-all hover:from-cyan-400 hover:to-blue-500"
                >
                  Start Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="mb-2 text-xl font-bold text-white">Submit Your Request</h3>
                <p className="mb-6 text-sm text-blue-200/50">Choose whether this is a service job or a class inquiry. Admin will review it first before any payment or approval step.</p>

                {submitError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {submitError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-all placeholder:text-blue-300/30 ${
                        errors.name ? 'border-red-400 bg-red-500/5' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-all placeholder:text-blue-300/30 ${
                        errors.email ? 'border-red-400 bg-red-500/5' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all placeholder:text-blue-300/30 focus:border-cyan-500/50"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Request Type *</label>
                    <select
                      value={form.requestType}
                      onChange={(e) => {
                        const nextType = e.target.value as RequestType;
                        setForm((prev) => ({
                          ...prev,
                          requestType: nextType,
                          service: '',
                          paymentMethod: 'mpesa',
                          complexity: 'starter',
                          transactionCode: '',
                        }));
                        setErrors((prev) => ({ ...prev, service: '', paymentMethod: '', complexity: '', transactionCode: '' }));
                        setSubmitError('');
                        setPaymentFeedback(null);
                      }}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-cyan-500/50"
                    >
                      <option value="service" className="bg-[#0a1628]">Service</option>
                      <option value="class" className="bg-[#0a1628]">Class</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-blue-200/70">
                    {form.requestType === 'class' ? 'Class *' : 'Service *'}
                  </label>
                  <select
                    value={form.service}
                    onChange={(e) => handleChange('service', e.target.value)}
                    className={`w-full cursor-pointer appearance-none rounded-xl border px-4 py-3 text-white outline-none transition-all ${
                      errors.service ? 'border-red-400 bg-red-500/5' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'
                    }`}
                  >
                    <option value="" className="bg-[#0a1628]">
                      {form.requestType === 'class' ? 'Select a class' : 'Select a service'}
                    </option>
                    {(form.requestType === 'class' ? CLASS_OPTIONS : SERVICE_OPTIONS).map((option) => (
                      <option key={option} value={option} className="bg-[#0a1628]">{option}</option>
                    ))}
                  </select>
                  {errors.service && <p className="mt-1 text-xs text-red-400">{errors.service}</p>}
                </div>

                {form.requestType === 'service' && form.service && (
                  <div className="space-y-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Service Payment Plan</p>
                        <h4 className="mt-2 text-xl font-bold text-white">{form.service}</h4>
                        <p className="mt-2 text-sm leading-6 text-blue-100/70">
                          Choose the delivery complexity and payment rail. The current estimate updates automatically.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/50">Current Estimate</p>
                        <p className="mt-1 text-2xl font-black text-white">{formatKes(currentPrice)}</p>
                        <p className="text-xs text-blue-200/50">{getComplexityLabel(form.complexity)}</p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-medium text-blue-200/70">Complexity *</label>
                      <div className="grid gap-3 md:grid-cols-3">
                        {COMPLEXITY_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleChange('complexity', option.id)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              form.complexity === option.id
                                ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                : 'border-white/10 bg-white/5 text-blue-100/70 hover:border-cyan-500/30'
                            }`}
                          >
                            <p className="text-sm font-semibold uppercase tracking-[0.18em]">{option.label}</p>
                            <p className="mt-3 text-xl font-black">{formatKes(getServicePrice(form.service, option.id))}</p>
                            <p className="mt-2 text-xs leading-5 text-inherit/80">{option.description}</p>
                          </button>
                        ))}
                      </div>
                      {errors.complexity && <p className="mt-1 text-xs text-red-400">{errors.complexity}</p>}
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-medium text-blue-200/70">Payment Method *</label>
                      <div className="grid gap-3 md:grid-cols-3">
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleChange('paymentMethod', option.id)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              form.paymentMethod === option.id
                                ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                : 'border-white/10 bg-white/5 text-blue-100/70 hover:border-cyan-500/30'
                            }`}
                          >
                            <p className="text-sm font-semibold uppercase tracking-[0.18em]">{option.label}</p>
                            <p className="mt-2 text-xs leading-5 text-inherit/80">{option.description}</p>
                          </button>
                        ))}
                      </div>
                      {errors.paymentMethod && <p className="mt-1 text-xs text-red-400">{errors.paymentMethod}</p>}
                    </div>

                    {form.paymentMethod === 'mpesa' && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-blue-200/70">M-Pesa Phone *</label>
                        <input
                          type="tel"
                          value={form.mpesaPhone}
                          onChange={(e) => handleChange('mpesaPhone', e.target.value)}
                          className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-all placeholder:text-blue-300/30 ${
                            errors.mpesaPhone ? 'border-red-400 bg-red-500/5' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'
                          }`}
                          placeholder="2547XXXXXXXX or 07XXXXXXXX"
                        />
                        {errors.mpesaPhone && <p className="mt-1 text-xs text-red-400">{errors.mpesaPhone}</p>}
                      </div>
                    )}

                    {form.paymentMethod === 'manual_mpesa' && (
                      <div className="space-y-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Manual M-Pesa Instructions</p>
                          <p className="mt-3 text-lg font-bold text-white">Send payment to 0757152440</p>
                          <p className="mt-2 text-sm leading-6 text-blue-100/75">
                            After sending the money, paste the M-Pesa transaction code below so the payment can be verified quickly.
                          </p>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Transaction Code *</label>
                          <input
                            type="text"
                            value={form.transactionCode}
                            onChange={(e) => handleChange('transactionCode', e.target.value.toUpperCase())}
                            className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-all placeholder:text-blue-300/30 ${
                              errors.transactionCode ? 'border-red-400 bg-red-500/5' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'
                            }`}
                            placeholder="e.g. SGH7K2LM9P"
                          />
                          {errors.transactionCode && <p className="mt-1 text-xs text-red-400">{errors.transactionCode}</p>}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/50">Primary Route</p>
                        <p className="mt-2 text-sm font-semibold text-white">Safaricom Daraja STK Push</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/50">Card Notes</p>
                        <p className="mt-2 text-sm font-semibold text-white">Debit and credit card preference can be captured from the same form.</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/50">Manual M-Pesa</p>
                        <p className="mt-2 text-sm font-semibold text-white">Direct send to 0757152440 is available when you want to accept payment without STK.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Project Details *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={4}
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-white outline-none transition-all placeholder:text-blue-300/30 ${
                      errors.message ? 'border-red-400 bg-red-500/5' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'
                    }`}
                    placeholder="Describe the work, target platform, deadlines, features, integrations, or support requirements..."
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {form.requestType === 'service' ? 'Submit Request' : 'Send Class Inquiry'}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
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
