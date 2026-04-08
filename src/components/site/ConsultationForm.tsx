import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  api,
  type ConsultationAgreementDocument,
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

type UploadedAgreementState = ConsultationAgreementDocument & {
  display_size: string;
};

type UploadedDocumentState = ConsultationIdDocument & {
  display_size: string;
};

type PaymentSelectionDetail = {
  paymentMethod: PaymentMethod;
  service?: string;
};

type PaymentSubmissionState = {
  success: boolean;
  message: string;
  customerMessage?: string | null;
  checkoutRequestId?: string | null;
  consultationId?: string;
};

const TERMS_VERSION = '2026-04-05';
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const PAYMENT_SELECTION_STORAGE_KEY = 'consultation-payment-selection';
const documentOptions: Array<{ value: ConsultationIdDocumentType; label: string }> = [
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'passport', label: 'Passport' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
];
const serviceAgreementSections = [
  {
    title: '1. Introduction',
    body:
      'Welcome to Expert Tech Solutions & Training. These Terms and Conditions ("Agreement") govern all client requests, service engagements, and training registrations submitted through any of our platforms or communication channels. By submitting a service or training request, engaging our team, or signing this Agreement electronically, you acknowledge that you have read, understood, and agreed to these Terms.',
  },
  {
    title: '2. Client Identity and Authorization',
    body:
      'You confirm that you are the individual named in the request, or you are duly authorized to act on behalf of the organization or person identified in the request. You further confirm that you have legal capacity and authority to enter into this Agreement. Any submission made by an unauthorized individual may be rejected or voided at our discretion.',
  },
  {
    title: '3. Accuracy of Information',
    body:
      'You agree to provide information, documents, and communications that are true, current, complete, and not misleading. Expert Tech Solutions & Training may verify your information at any time to confirm authenticity. Submission of false, misleading, or altered documents or information may result in immediate rejection, suspension, or legal action.',
  },
  {
    title: '4. Request Review and Acceptance',
    body:
      'Submitting a request or signed document does not create a binding contract until it has been reviewed and explicitly accepted in writing by Expert Tech Solutions & Training. Only upon written acceptance or formal confirmation will service engagements, deliverables, pricing, or timelines become binding. We reserve the right to accept, defer, seek clarification on, or decline a request at our sole discretion.',
  },
  {
    title: '5. Scope and Commercial Terms',
    body:
      'Final service scope, deliverables, pricing, revisions, milestones, and implementation details are subject to admin review and clarification with the Client, formal written confirmation, and any subsequent agreed addendum, quotation, or work order. No verbal assurances, drafts, or preliminary discussions are considered binding unless explicitly confirmed in writing.',
  },
  {
    title: '6. Verification and Compliance',
    body:
      'You authorize Expert Tech Solutions & Training to review and verify identification documents, agreements, and materials submitted, conduct risk, compliance, and onboarding reviews, and retain and process your data and materials for legitimate operational purposes. We may delay or withhold commencement of work or class activation until verification is complete.',
  },
  {
    title: '7. Payments and Activation',
    body:
      'Payments must follow official instructions issued by Expert Tech Solutions & Training. You acknowledge that work will not commence until payment requirements and verification are completed, any delay in payment or document verification may affect scheduling, and refund or rescheduling terms will be governed by your approved service agreement.',
  },
  {
    title: '8. Communications and Notifications',
    body:
      'You consent to receive communications and official updates via email, phone, WhatsApp, dashboard messages, and other approved digital channels. Messages may include onboarding, payment, training, or service update notifications. All communications from our verified business addresses or numbers shall be deemed valid notices under this Agreement.',
  },
  {
    title: '9. Limitation of Submission Effect',
    body:
      'Submission of a form, request, or signed file does not guarantee service engagement, scheduling, pricing, or delivery inclusion. We reserve full discretion to reject or postpone any submission due to verification concerns, scope or scheduling conflicts, commercial feasibility, and legal or compliance considerations.',
  },
  {
    title: '10. Document Integrity',
    body:
      'You must not upload, submit, or distribute any document or information that is false or misleading, forged, altered, stolen, or unauthorized, or in violation of third-party intellectual property rights. Suspicious uploads may be reported or escalated for further review.',
  },
  {
    title: '11. Intellectual Property',
    body:
      'All proposals, designs, code, documentation, deliverables, frameworks, and supporting materials provided by Expert Tech Solutions & Training are protected under intellectual property law. You may not copy, distribute, modify, reproduce, or use any material beyond the scope of your approved service engagement.',
  },
  {
    title: '12. Limitation of Liability',
    body:
      'To the maximum extent permitted by law, Expert Tech Solutions & Training shall not be liable for indirect, consequential, or incidental damages, including loss of data, profit, or opportunity. Our total liability for any claim related to this Agreement shall not exceed the amount paid by the Client for the specific service engagement giving rise to the claim.',
  },
  {
    title: '13. Confidentiality and Data Privacy',
    body:
      'Both parties agree to protect confidential information shared during the engagement. Personal data will be processed in accordance with applicable data protection laws and our internal privacy practices.',
  },
  {
    title: '14. Governing Law and Jurisdiction',
    body:
      'This Agreement shall be governed by and construed under the laws of Kenya. In case of dispute, both parties agree to first pursue resolution through reasonable mediation before seeking legal recourse in competent courts within the same jurisdiction.',
  },
  {
    title: '15. Electronic Signature and Acceptance',
    body:
      'By signing electronically, checking the acceptance box, or submitting this document digitally, you acknowledge and agree that your electronic signature has the same legal effect as a handwritten signature and that you accept and intend to be legally bound by these terms.',
  },
];

const classAgreementSections = [
  {
    title: '1. Introduction',
    body:
      'Welcome to Expert Tech Solutions & Training. These Terms and Conditions ("Agreement") govern all class requests, training enrollments, certification access, and learning support arrangements submitted through any of our platforms or communication channels. By requesting a class, signing this Agreement electronically, or proceeding with training onboarding, you acknowledge that you have read, understood, and agreed to these Terms.',
  },
  {
    title: '2. Learner Identity and Authorization',
    body:
      'You confirm that you are the learner named in the request, or you are duly authorized to submit the request on behalf of the learner identified in the application. You further confirm that you have legal capacity and authority to enter into this Agreement. Any submission made by an unauthorized individual may be rejected or voided at our discretion.',
  },
  {
    title: '3. Accuracy of Information',
    body:
      'You agree to provide information, academic details, identification documents, and communications that are true, current, complete, and not misleading. Expert Tech Solutions & Training may verify your information at any time to confirm authenticity. Submission of false, misleading, or altered information may result in immediate rejection, suspension, or removal from the learning process.',
  },
  {
    title: '4. Enrollment Review and Acceptance',
    body:
      'Submitting a class request or signed document does not create a confirmed enrollment until it has been reviewed and explicitly accepted in writing by Expert Tech Solutions & Training. Only upon written acceptance or formal confirmation will class placement, certification access, learning schedules, or onboarding steps become binding. We reserve the right to accept, defer, seek clarification on, or decline a request at our sole discretion.',
  },
  {
    title: '5. Training Scope and Delivery Terms',
    body:
      'Final training content, schedules, certification tracks, instructor support, assessments, class progression, and learner access rules are subject to admin review, formal written confirmation, and any approved learning plan issued to the learner. No verbal assurances, promotional statements, or draft schedules are considered binding unless explicitly confirmed in writing.',
  },
  {
    title: '6. Verification and Compliance',
    body:
      'You authorize Expert Tech Solutions & Training to review and verify identification documents, signed agreements, learner records, and submitted materials, conduct risk, compliance, and onboarding reviews, and retain and process your data for legitimate training and operational purposes. We may delay or withhold class activation until verification is complete.',
  },
  {
    title: '7. Fees, Payments, and Class Activation',
    body:
      'Payments must follow official instructions issued by Expert Tech Solutions & Training. You acknowledge that class access, certification onboarding, assessments, and active learning support may be withheld until payment requirements and verification are completed. Any delay in payment or document verification may affect class scheduling, seat availability, or progression timelines.',
  },
  {
    title: '8. Communications and Notifications',
    body:
      'You consent to receive communications and official updates via email, phone, WhatsApp, dashboard messages, and other approved digital channels. Messages may include enrollment confirmation, payment instructions, class scheduling, learner support notices, assessments, and certification updates. All communications from our verified business addresses or numbers shall be deemed valid notices under this Agreement.',
  },
  {
    title: '9. Limitation of Submission Effect',
    body:
      'Submission of a class request, form, or signed file does not guarantee training acceptance, class scheduling, certification activation, or seat reservation. We reserve full discretion to reject or postpone any submission due to verification concerns, schedule conflicts, academic fit, operational limitations, or legal and compliance considerations.',
  },
  {
    title: '10. Learner Conduct and Document Integrity',
    body:
      'You must not upload, submit, or distribute any document or information that is false, misleading, forged, altered, stolen, unauthorized, abusive, or in violation of third-party rights. You also agree to participate respectfully in the learning process and follow any published learner conduct requirements issued for your class or certification path.',
  },
  {
    title: '11. Intellectual Property and Learning Materials',
    body:
      'All class materials, lesson content, assessments, courseware, exercises, slides, recordings, and supporting documents provided by Expert Tech Solutions & Training are protected under intellectual property law. You may not copy, distribute, resell, republish, modify, or use any material beyond your approved personal or organizational learning access without written permission.',
  },
  {
    title: '12. Limitation of Liability',
    body:
      'To the maximum extent permitted by law, Expert Tech Solutions & Training shall not be liable for indirect, consequential, or incidental damages, including loss of academic opportunity, data, income, or business interruption. Our total liability for any claim related to this Agreement shall not exceed the amount paid by the learner or sponsoring client for the specific class or training program giving rise to the claim.',
  },
  {
    title: '13. Confidentiality and Data Privacy',
    body:
      'Both parties agree to protect confidential information shared during onboarding and training. Personal data will be processed in accordance with applicable data protection laws and our internal privacy practices, including records necessary for training administration, support, assessments, and certification workflows.',
  },
  {
    title: '14. Governing Law and Jurisdiction',
    body:
      'This Agreement shall be governed by and construed under the laws of Kenya. In case of dispute, both parties agree to first pursue resolution through reasonable mediation before seeking legal recourse in competent courts within the same jurisdiction.',
  },
  {
    title: '15. Electronic Signature and Acceptance',
    body:
      'By signing electronically, checking the acceptance box, or submitting this document digitally, you acknowledge and agree that your electronic signature has the same legal effect as a handwritten signature and that you accept and intend to be legally bound by these training and enrollment terms.',
  },
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

function getAgreementConfig(requestType: RequestType) {
  if (requestType === 'class') {
    return {
      title: 'Learning Class Agreement and Terms & Conditions',
      sections: classAgreementSections,
    };
  }

  return {
    title: 'Legal User Agreement and Terms & Conditions',
    sections: serviceAgreementSections,
  };
}

function buildAgreementPdf(version: string, requestType: RequestType) {
  const effectiveDate = version;
  const agreementConfig = getAgreementConfig(requestType);
  const pageWidth = 612;
  const pageHeight = 842;
  const bottomMargin = 60;
  const pages: string[][] = [];

  const startPage = () => {
    const pageLines = [
      '0.08 0.78 0.95 rg',
      '50 785 58 30 re f',
      'BT',
      '/F1 18 Tf',
      '1 1 1 rg',
      '64 794 Td',
      '(KCJ) Tj',
      'ET',
      'BT',
      '/F1 16 Tf',
      '0 0 0 rg',
      '120 802 Td',
      '(Expert Tech Solutions & Training) Tj',
      'ET',
    ];
    pages.push(pageLines);
    return pageLines;
  };

  let currentPage = startPage();
  let y = 760;

  const writeLine = (line: string, size = 11, gap = 7) => {
    if (y < bottomMargin) {
      currentPage = startPage();
      y = 760;
    }

    currentPage.push('BT');
    currentPage.push(`/F1 ${size} Tf`);
    currentPage.push('0 0 0 rg');
    currentPage.push(`1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`);
    currentPage.push('ET');
    y -= size + gap;
  };

  writeLine(agreementConfig.title, 14);
  writeLine(`Version: ${version}`, 11);
  writeLine(`Effective Date: ${effectiveDate}`, 11);
  y -= 8;

  agreementConfig.sections.forEach((section) => {
    writeLine(section.title, 12);
    wrapAgreementLine(section.body, 92).forEach((line) => writeLine(line, 10));
    y -= 6;
  });

  writeLine('Signature and Confirmation', 12);
  writeLine('Client Signature: __________________________________________', 11);
  writeLine('Printed Name: _____________________________________________', 11);
  writeLine('Date: ___________________', 11);
  y -= 4;
  writeLine('Company Representative: ___________________________________', 11);
  writeLine('Position: _________________________________________________', 11);

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    `2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj`,
  ];

  pages.forEach((pageLines, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const stream = pageLines.join('\n');
    objects.push(
      `${pageObjectId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>\nendobj`,
    );
    objects.push(
      `${contentObjectId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
    );
  });

  objects.push(`${3 + pages.length * 2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

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
  const [uploadedAgreement, setUploadedAgreement] = useState<UploadedAgreementState | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocumentState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paymentSubmission, setPaymentSubmission] = useState<PaymentSubmissionState | null>(null);
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

  useEffect(() => {
    const applyPaymentSelection = (selection: PaymentSelectionDetail | null) => {
      if (!selection) return;

      const validPaymentMethod = PAYMENT_METHOD_OPTIONS.some((option) => option.id === selection.paymentMethod);
      if (!validPaymentMethod) return;

      const nextService =
        selection.service && SERVICE_OPTIONS.includes(selection.service as never) ? selection.service : '';

      setForm((prev) => ({
        ...prev,
        requestType: 'service',
        service: nextService || prev.service,
        paymentMethod: selection.paymentMethod,
        complexity: prev.complexity || 'starter',
        transactionCode: selection.paymentMethod === 'manual_mpesa' ? prev.transactionCode : '',
      }));
      setErrors((prev) => ({ ...prev, paymentMethod: '', service: '', transactionCode: '' }));
      setSubmitError('');
    };

    const storedSelection = window.localStorage.getItem(PAYMENT_SELECTION_STORAGE_KEY);
    if (storedSelection) {
      try {
        applyPaymentSelection(JSON.parse(storedSelection) as PaymentSelectionDetail);
        window.localStorage.removeItem(PAYMENT_SELECTION_STORAGE_KEY);
      } catch {
        window.localStorage.removeItem(PAYMENT_SELECTION_STORAGE_KEY);
      }
    }

    const handleSelectionEvent = (event: Event) => {
      const customEvent = event as CustomEvent<PaymentSelectionDetail>;
      applyPaymentSelection(customEvent.detail ?? null);
    };

    window.addEventListener('consultation-payment-selection', handleSelectionEvent as EventListener);
    return () => {
      window.removeEventListener('consultation-payment-selection', handleSelectionEvent as EventListener);
    };
  }, []);

  const currentPrice =
    form.requestType === 'service' && form.service
      ? getServicePrice(form.service, form.complexity)
      : 0;
  const agreementConfig = getAgreementConfig(form.requestType);

  const handleDownloadAgreementPdf = () => {
    const pdfBlob = buildAgreementPdf(TERMS_VERSION, form.requestType);
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

  const handleAgreementUpload = async (file: File | null) => {
    if (!file) {
      setUploadedAgreement(null);
      return;
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    if (!allowedMimeTypes.has(file.type)) {
      setErrors((prev) => ({ ...prev, agreementDocument: 'Signed agreement must be a PDF, JPG, PNG, or WEBP file.' }));
      return;
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      setErrors((prev) => ({ ...prev, agreementDocument: 'Signed agreement must be 5 MB or smaller.' }));
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read the selected agreement file.'));
      reader.readAsDataURL(file);
    });

    setUploadedAgreement({
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      data_url: dataUrl,
      display_size: formatFileSize(file.size),
    });
    setErrors((prev) => ({ ...prev, agreementDocument: '' }));
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
    if (!uploadedAgreement) newErrors.agreementDocument = 'Please upload the signed agreement after signing it.';
    if (!uploadedDocument) newErrors.idDocument = 'Please upload one identification document.';

    if (form.requestType === 'service') {
      if (!form.complexity) newErrors.complexity = 'Please select service complexity';
      if (!form.paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
      if (form.paymentMethod === 'mpesa' && !form.mpesaPhone.trim()) {
        newErrors.mpesaPhone = 'Please provide the M-Pesa phone number for STK Push';
      }
      if (form.paymentMethod === 'manual_mpesa' && !form.transactionCode.trim()) {
        newErrors.transactionCode = 'Please enter the M-Pesa transaction code';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (submitError) setSubmitError('');
    if (paymentSubmission) setPaymentSubmission(null);
  };

  const resetForm = () => {
    setForm(createInitialForm(profile?.full_name || '', user?.email || '', profile?.phone || ''));
    setUploadedAgreement(null);
    setUploadedDocument(null);
    setPaymentSubmission(null);
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
        agreement_document: {
          file_name: uploadedAgreement?.file_name || '',
          mime_type: uploadedAgreement?.mime_type || '',
          size_bytes: uploadedAgreement?.size_bytes || 0,
          data_url: uploadedAgreement?.data_url || '',
        },
        id_document: {
          document_type: form.documentType,
          file_name: uploadedDocument?.file_name || '',
          mime_type: uploadedDocument?.mime_type || '',
          size_bytes: uploadedDocument?.size_bytes || 0,
          data_url: uploadedDocument?.data_url || '',
        },
        status: 'pending',
      };

      const { consultation } = await api.createConsultation(consultationData);

      if (form.requestType === 'service') {
        try {
          const paymentResponse = await api.initializePayment({
            consultation_id: consultation.id,
            service: form.service,
            request_type: form.requestType,
            payment_method: form.paymentMethod,
            complexity: form.complexity,
            amount: currentPrice,
            phone: form.paymentMethod === 'mpesa' ? form.mpesaPhone : form.phone,
            transaction_code: form.paymentMethod === 'manual_mpesa' ? form.transactionCode : undefined,
          });

          setPaymentSubmission({
            success: true,
            message: paymentResponse.message,
            customerMessage: paymentResponse.customerMessage,
            checkoutRequestId: paymentResponse.checkoutRequestId,
            consultationId: consultation.id,
          });
        } catch (paymentError: unknown) {
          setPaymentSubmission({
            success: false,
            message: 'Your request was submitted, but payment could not be started automatically.',
            customerMessage: getErrorMessage(paymentError, 'Please retry payment or contact support to continue.'),
            consultationId: consultation.id,
          });
        }
      } else {
        setPaymentSubmission(null);
      }

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
              Download the agreement, sign it, upload the signed copy, then attach one identification document so admin can review everything before approval or payment steps begin.
            </p>

            {user && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-300">Signed in as {profile?.full_name || user.email}</p>
                  <p className="text-xs text-blue-200/40">Your request history, signed agreement, and document review will stay attached to your dashboard account.</p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Step One</p>
                <p className="mt-3 text-2xl font-black text-white">Download, Sign, Upload, Verify</p>
                <p className="mt-2 text-sm leading-6 text-blue-200/60">
                  Every request now includes a downloadable agreement, a signed-agreement upload, and one identification document before admin review.
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
                  1. Download and sign agreement. 2. Upload signed agreement and ID. 3. Submit request. 4. Admin reviews everything before approval and payment steps.
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
                  {form.requestType === 'service'
                    ? paymentSubmission?.success
                      ? 'Request Submitted and Payment Started'
                      : 'Request Submitted'
                    : 'Class Inquiry Sent'}
                </h3>
                <p className="mb-6 text-blue-200/60">
                  {form.requestType === 'service'
                    ? paymentSubmission?.success
                      ? paymentSubmission.message
                      : paymentSubmission?.message || 'Your signed agreement, identification document, and request details have been sent for admin review.'
                    : 'Your signed agreement, identification document, and request details have been sent for admin review.'}
                </p>
                {paymentSubmission?.customerMessage && (
                  <div className={`mb-6 rounded-2xl border p-4 text-left text-sm ${
                    paymentSubmission.success
                      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                      : 'border-amber-400/20 bg-amber-500/10 text-amber-100'
                  }`}>
                    {paymentSubmission.customerMessage}
                  </div>
                )}
                {paymentSubmission?.checkoutRequestId && (
                  <p className="mb-4 text-xs text-blue-200/50">
                    Checkout Request ID: {paymentSubmission.checkoutRequestId}
                  </p>
                )}
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
                <p className="mb-6 text-sm text-blue-200/50">Choose whether this is a service job or a class inquiry, download the agreement, sign it, upload the signed copy, and then attach one ID document for admin review.</p>

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
                        setPaymentSubmission(null);
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
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/50">M-Pesa First</p>
                        <p className="mt-2 text-sm font-semibold text-white">Fast, trusted mobile checkout</p>
                        <p className="mt-2 text-xs leading-5 text-blue-100/70">Ideal for clients who want a smooth approval-to-payment experience with secure confirmation directly on their phone.</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/50">Manual M-Pesa</p>
                        <p className="mt-2 text-sm font-semibold text-white">Flexible backup payment route</p>
                        <p className="mt-2 text-xs leading-5 text-blue-100/70">Useful when clients prefer direct transfer confirmation or need an alternative while final onboarding details are being completed.</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/50">Card or Bank</p>
                        <p className="mt-2 text-sm font-semibold text-white">Professional options for larger engagements</p>
                        <p className="mt-2 text-xs leading-5 text-blue-100/70">Best suited for company clients, structured projects, and approved engagements that require a more formal payment arrangement.</p>
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
                      <h4 className="mt-2 text-xl font-bold text-white">{agreementConfig.title}</h4>
                      <p className="mt-2 text-sm text-blue-200/60">Download this agreement as a PDF, sign it, then upload the signed copy below before submitting your request.</p>
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

                  <div className="mt-4 space-y-4 text-sm leading-6 text-blue-100/80">
                    {agreementConfig.sections.map((section) => (
                      <div key={section.title} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
                        <p className="font-semibold text-white">{section.title}</p>
                        <p className="mt-2 text-blue-100/80">{section.body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <p className="font-semibold">Signature Instructions</p>
                    <p className="mt-2 text-amber-100/80">
                      Download the PDF, add your handwritten or electronic signature in the signature section, save the signed file, then upload that signed agreement here.
                    </p>
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
                    <label className="mb-2 block text-sm font-medium text-blue-100">Upload Signed Agreement *</label>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        void handleAgreementUpload(e.target.files?.[0] || null);
                      }}
                      className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-100 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
                    />
                    <p className="mt-2 text-xs text-blue-200/50">Upload the signed agreement as PDF, JPG, PNG, or WEBP after signing it.</p>
                    {uploadedAgreement && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-100">
                        <p className="font-semibold text-white">{uploadedAgreement.file_name}</p>
                        <p className="mt-1 text-xs text-blue-200/60">{uploadedAgreement.display_size} • Signed agreement uploaded</p>
                      </div>
                    )}
                    {errors.agreementDocument && <p className="mt-2 text-xs text-red-400">{errors.agreementDocument}</p>}
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
                  disabled={isSubmitting || !form.agreementChecked}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {form.requestType === 'service' ? 'Submit Request & Start Payment' : 'Send Class Inquiry'}
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
