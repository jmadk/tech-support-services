import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  api,
  getErrorMessage,
  type ConsultationIdDocument,
  type ConsultationIdDocumentType,
  type ConsultationRequestType,
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

type RequestType = ConsultationRequestType;

type FormState = {
  name: string;
  email: string;
  phone: string;
  requestType: RequestType;
  service: string;
  complexity: ServiceComplexity;
  paymentMethod: PaymentMethod;
  mpesaPhone: string;
  transactionCode: string;
  message: string;
  signatureName: string;
  documentType: ConsultationIdDocumentType;
  agreementChecked: boolean;
};

type UploadedDocumentState = ConsultationIdDocument & {
  display_size: string;
};

const TERMS_VERSION = '2026-04-05';
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const documentOptions: Array<{ value: ConsultationIdDocumentType; label: string }> = [
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'passport', label: 'Passport' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
];
const agreementPoints = [
  'I confirm that the information in this request is accurate and truthful.',
  'I understand admin must review this request before approval, class activation, or payment confirmation.',
  'I authorize Expert Tech Solutions & Training to review my agreement details and uploaded ID for verification and service delivery.',
  'I agree not to upload false, altered, or misleading identification documents.',
  'I understand scope, timelines, and approval decisions depend on review outcomes, availability, and payment confirmation where applicable.',
  'I consent to follow-up through email, phone, WhatsApp, or dashboard updates about this request.',
];

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapAgreementLine(text: string, maxLength = 82) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function buildAgreementPdf(points: string[], version: string) {
  const lines = [
    'Expert Tech Solutions & Training',
    'User Agreement and Terms',
    `Version ${version}`,
    '',
    ...points.flatMap((point, index) => wrapAgreementLine(`${index + 1}. ${point}`)),
    '',
    'This agreement must be reviewed before signing and submitting the request form.',
  ];

  let y = 780;
  const contentLines = ['BT', '/F1 12 Tf', '50 800 Td'];

  lines.forEach((line, index) => {
    if (index === 0) {
      contentLines.push(`(${escapePdfText(line)}) Tj`);
    } else {
      y -= 18;
      contentLines.push(`1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`);
    }
  });

  contentLines.push('ET');
  const stream = contentLines.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function createInitialForm(userName = '', email = '', phone = ''): FormState {
  return {
    name: userName,
    email,
    phone,
    requestType: 'service',
    service: '',
    complexity: 'starter',
    paymentMethod: 'mpesa',
    mpesaPhone: phone,
    transactionCode: '',
    message: '',
    signatureName: userName,
    documentType: 'national_id',
    agreementChecked: false,
  };
}

const ConsultationForm: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState<FormState>(createInitialForm());
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocumentState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  useEffect(() => {
    if (user && profile) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || profile.full_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || profile.phone || '',
        mpesaPhone: prev.mpesaPhone || profile.phone || '',
        transactionCode: prev.transactionCode || '',
        signatureName: prev.signatureName || profile.full_name || '',
      }));
    }
  }, [user, profile]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedType = params.get('requestType');
    const requestedService = params.get('service');
    const requestType = requestedType === 'class' ? 'class' : 'service';
    const validOptions = requestType === 'class' ? CLASS_OPTIONS : SERVICE_OPTIONS;

    if (!requestedService || !validOptions.includes(requestedService as never)) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      requestType,
      service: requestedService,
    }));

    if (location.hash === '#contact') {
      window.requestAnimationFrame(() => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.search, location.hash]);

  const currentPrice =
    form.requestType === 'service' && form.service
      ? getServicePrice(form.service, form.complexity)
      : 0;

  const handleDownloadAgreementPdf = () => {
    const pdfBlob = buildAgreementPdf(agreementPoints, TERMS_VERSION);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expert-tech-user-agreement-${TERMS_VERSION}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDocumentUpload = async (file: File | null) => {
    if (!file) {
      setUploadedDocument(null);
      return;
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    if (!allowedMimeTypes.has(file.type)) {
      setErrors((prev) => ({ ...prev, idDocument: 'Only PDF, JPG, PNG, or WEBP files are allowed.' }));
      return;
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      setErrors((prev) => ({ ...prev, idDocument: 'Document must be 5 MB or smaller.' }));
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.readAsDataURL(file);
    });

    setUploadedDocument({
      document_type: form.documentType,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      data_url: dataUrl,
      display_size: formatFileSize(file.size),
    });
    setErrors((prev) => ({ ...prev, idDocument: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.service) newErrors.service = `Please select a ${form.requestType}`;
    if (!form.message.trim()) newErrors.message = 'Message is required';
    if (!form.signatureName.trim()) newErrors.signatureName = 'Typed signature is required';
    if (!form.agreementChecked) newErrors.agreementChecked = 'You must accept the terms before submitting.';
    if (!uploadedDocument) newErrors.idDocument = 'Please upload one identification document.';

    if (form.requestType === 'service') {
      if (!form.complexity) newErrors.complexity = 'Please select service complexity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (submitError) setSubmitError('');
  };

  const resetForm = () => {
    setForm(createInitialForm(profile?.full_name || '', user?.email || '', profile?.phone || ''));
    setUploadedDocument(null);
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
        request_type: form.requestType,
        service: form.service,
        message: form.message,
        terms_version: TERMS_VERSION,
        agreement_accepted: true,
        signature_name: form.signatureName,
        signed_at: new Date().toISOString(),
        id_document: {
          document_type: form.documentType,
          file_name: uploadedDocument?.file_name || '',
          mime_type: uploadedDocument?.mime_type || '',
          size_bytes: uploadedDocument?.size_bytes || 0,
          data_url: uploadedDocument?.data_url || '',
        },
        status: 'pending',
      };

      await api.createConsultation(consultationData);

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
              Submit your request, read and sign the agreement, then attach one identification document so admin can review everything before approval or payment steps begin.
            </p>

            {user && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-300">Signed in as {profile?.full_name || user.email}</p>
                  <p className="text-xs text-blue-200/40">Your request history, agreement, and document review will stay attached to your dashboard account.</p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Step One</p>
                <p className="mt-3 text-2xl font-black text-white">Agreement and ID Verification</p>
                <p className="mt-2 text-sm leading-6 text-blue-200/60">
                  Every service or class request now includes a typed signature and one uploaded identification document before admin review.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Accepted Documents</p>
                <p className="mt-3 text-2xl font-black text-white">National ID, License, Passport, or Birth Certificate</p>
                <p className="mt-2 text-sm leading-6 text-blue-200/60">
                  Upload a readable PDF or image under 5 MB so admin can approve or reject the request with the right context.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Review Flow</p>
                <p className="mt-3 text-sm leading-7 text-blue-200/60">
                  1. Submit request. 2. Admin checks your agreement and ID document. 3. Approval, payment instructions, and delivery steps follow in the correct order.
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
                  Your signed agreement and attached identification document have been sent with the request for admin review. Wait for official follow-up before making any payment unless admin instructs otherwise.
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
                <p className="mb-6 text-sm text-blue-200/50">Choose whether this is a service job or a class inquiry, then complete the agreement and upload one ID document for admin review.</p>

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

                <div className="rounded-2xl border border-white/10 bg-[#0c1d34] p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">User Agreement</p>
                      <h4 className="mt-2 text-xl font-bold text-white">Terms and Conditions Before Review</h4>
                      <p className="mt-2 text-sm text-blue-200/60">Download these terms as a PDF before signing if you want a copy for your records.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-blue-200/50">Version {TERMS_VERSION}</p>
                      <button
                        type="button"
                        onClick={handleDownloadAgreementPdf}
                        className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500/20"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-blue-100/80">
                    {agreementPoints.map((point) => (
                      <div key={point} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        {point}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Typed Signature *</label>
                      <input
                        type="text"
                        value={form.signatureName}
                        onChange={(e) => handleChange('signatureName', e.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-all placeholder:text-blue-300/30 ${
                          errors.signatureName ? 'border-red-400 bg-red-500/5' : 'border-white/10 bg-white/5 focus:border-cyan-500/50'
                        }`}
                        placeholder="Type your full name"
                      />
                      {errors.signatureName && <p className="mt-1 text-xs text-red-400">{errors.signatureName}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-blue-200/70">Identification Document Type *</label>
                      <select
                        value={form.documentType}
                        onChange={(e) => {
                          const nextType = e.target.value as ConsultationIdDocumentType;
                          handleChange('documentType', nextType);
                          setUploadedDocument((prev) => (prev ? { ...prev, document_type: nextType } : prev));
                        }}
                        className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-cyan-500/50"
                      >
                        {documentOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-[#0a1628]">{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-500/5 p-4">
                    <label className="mb-2 block text-sm font-medium text-blue-100">Attach Identification Document *</label>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        void handleDocumentUpload(e.target.files?.[0] || null);
                      }}
                      className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-100 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
                    />
                    <p className="mt-2 text-xs text-blue-200/50">Accepted: National ID, Driver&apos;s License, Passport, or Birth Certificate in PDF, JPG, PNG, or WEBP format.</p>
                    {uploadedDocument && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-100">
                        <p className="font-semibold text-white">{uploadedDocument.file_name}</p>
                        <p className="mt-1 text-xs text-blue-200/60">{uploadedDocument.display_size} • {documentOptions.find((option) => option.value === form.documentType)?.label}</p>
                      </div>
                    )}
                    {errors.idDocument && <p className="mt-2 text-xs text-red-400">{errors.idDocument}</p>}
                  </div>

                  <label className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-blue-100">
                    <input
                      type="checkbox"
                      checked={form.agreementChecked}
                      onChange={(e) => handleChange('agreementChecked', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500"
                    />
                    <span>
                      I have read the terms and conditions above, I agree to them, and I confirm that the attached identification document is valid for this request.
                    </span>
                  </label>
                  {errors.agreementChecked && <p className="mt-2 text-xs text-red-400">{errors.agreementChecked}</p>}
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
