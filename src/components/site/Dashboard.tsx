// Deploy trigger: updated curriculum cards and resume progress
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  api,
  getErrorMessage,
  type Consultation,
  type LessonActivityRecord,
  type ConsultationNextPathStatus,
  type ConsultationPaymentStatus,
  type ConsultationStatus,
  type LessonAssessmentRecord,
  type SavedService,
} from '@/lib/api';
import { resolveCertificationCourseTitle } from '@/lib/certification-paths';
import { IT_SUPPORT_CUSTOMER_CARE_COURSE, IT_SUPPORT_CUSTOMER_CARE_TRACK } from '@/lib/it-support-course';
import { OWNER_EMAIL } from '@/lib/site-config';

type DashTab = 'overview' | 'consultations' | 'inbox' | 'saved' | 'profile' | 'settings';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const paymentStatusColors: Record<ConsultationPaymentStatus, string> = {
  not_requested: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  awaiting_payment: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  paid: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
};

function getPaymentStatusLabel(status: ConsultationPaymentStatus) {
  switch (status) {
    case 'not_requested':
      return 'Awaiting admin review';
    case 'awaiting_payment':
      return 'Payment requested';
    case 'paid':
      return 'Payment received';
    default:
      return 'Awaiting admin review';
  }
}

function getApprovalStatusLabel(consultation: Consultation) {
  if (consultation.owner_agreed !== 'yes') {
    return 'Pending';
  }

  return consultation.manual_access_granted === 'yes' ? 'Approved by admin override' : 'Approved after payment';
}

function matchesCourseTitle(consultation: Consultation, courseTitle: string) {
  const resolvedCourseTitle = resolveCertificationCourseTitle(consultation.service);
  return consultation.service === courseTitle || resolvedCourseTitle === courseTitle;
}

function formatElapsedDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function getLiveElapsedSeconds(activity: LessonActivityRecord, nowMs: number) {
  const completedAtMs = activity.completed_at ? new Date(activity.completed_at).getTime() : null;
  if (completedAtMs) {
    return Math.min(activity.required_seconds, activity.elapsed_seconds);
  }

  const lastSeenMs = new Date(activity.last_seen_at).getTime();
  const extraSeconds = Math.max(0, Math.floor((nowMs - lastSeenMs) / 1000));
  return Math.min(activity.required_seconds || Number.MAX_SAFE_INTEGER, activity.elapsed_seconds + extraSeconds);
}

const classWorkflowColors: Record<ConsultationNextPathStatus, string> = {
  pending: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  test_in_progress: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  test_completed: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  certification_started: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  revoked: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  terminated: 'bg-red-500/10 text-red-300 border-red-500/20',
};

function getClassWorkflowLabel(status: ConsultationNextPathStatus) {
  switch (status) {
    case 'test_in_progress':
      return 'Class test running';
    case 'test_completed':
      return 'Test completed';
    case 'certification_started':
      return 'Certification live';
    case 'revoked':
      return 'Revoked';
    case 'terminated':
      return 'Terminated';
    case 'pending':
    default:
      return 'Ready to start';
  }
}

function getRequestTypeLabel(type: Consultation['request_type']) {
  return type === 'class' ? 'Class Inquiry' : 'Service Request';
}

function getDocumentTypeLabel(type: string) {
  switch (type) {
    case 'national_id':
      return 'National ID';
    case 'drivers_license':
      return "Driver's License";
    case 'passport':
      return 'Passport';
    case 'birth_certificate':
      return 'Birth Certificate';
    default:
      return 'Identification Document';
  }
}
type SessionAccessItem = {
  session: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  score: number | null;
};

function pickLatestAssessmentRecord(
  primary: LessonAssessmentRecord | null,
  secondary: LessonAssessmentRecord | null,
) {
  if (!primary) return secondary;
  if (!secondary) return primary;

  return new Date(primary.submitted_at).getTime() >= new Date(secondary.submitted_at).getTime() ? primary : secondary;
}

function slugifyStorageValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizeSessionTitle(label: string): string {
  return label
    .replace(/^\d+\.\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    .toLowerCase();
}

function buildSessionLabelResolver(sessions: string[]) {
  const lookup = sessions.reduce<Record<string, string>>((acc, session) => {
    acc[normalizeSessionTitle(session)] = session;
    return acc;
  }, {});

  return (label: string) => lookup[normalizeSessionTitle(label)] || label;
}

function getLocalLessonProgress(consultationId: string, courseTitle: string) {
  if (!consultationId || !courseTitle) {
    return null;
  }

  const storageKey = `lesson_${consultationId}`;
  const progressStorageKey = `${storageKey}_progress_${slugifyStorageValue(courseTitle)}`;
  const storedProgress = sessionStorage.getItem(progressStorageKey);
  if (!storedProgress) {
    return null;
  }

  try {
    return JSON.parse(storedProgress);
  } catch {
    return null;
  }
}

function buildSessionAccessList(
  sessions: string[],
  records: LessonAssessmentRecord[],
  consultationId: string,
  courseTitle: string,
): SessionAccessItem[] {
  const resolveSessionLabel = buildSessionLabelResolver(sessions);
  const latestTopicRecords = records
    .filter(
      (record) =>
        record.consultation_id === consultationId &&
        record.course === courseTitle &&
        record.assessment_type === 'topic_quiz',
    )
    .reduce<Record<string, LessonAssessmentRecord>>((acc, record) => {
      const resolvedLabel = resolveSessionLabel(record.session_label);
      acc[resolvedLabel] = pickLatestAssessmentRecord(acc[resolvedLabel] || null, record) || record;
      return acc;
    }, {});

  const firstIncompleteIndex = sessions.findIndex((session) => !latestTopicRecords[session]);
  const highestUnlockedIndex =
    firstIncompleteIndex === -1
      ? sessions.length - 1
      : firstIncompleteIndex;

  return sessions.map((session, index) => ({
    session,
    isCompleted: Boolean(latestTopicRecords[session]),
    isUnlocked:
      index <= highestUnlockedIndex ||
      Boolean(latestTopicRecords[session]),
    score: latestTopicRecords[session]?.score ?? null,
  }));
}

function getConsultationAssessmentSummary(
  records: LessonAssessmentRecord[],
  consultationId: string,
) {
  const scopedRecords = records.filter((record) => record.consultation_id === consultationId);
  const latestTopicRecordsBySession = scopedRecords
    .filter((record) => record.assessment_type === 'topic_quiz')
    .reduce<Record<string, LessonAssessmentRecord>>((acc, record) => {
      const normalizedLabel = normalizeSessionTitle(record.session_label);
      acc[normalizedLabel] = pickLatestAssessmentRecord(acc[normalizedLabel] || null, record) || record;
      return acc;
    }, {});
  const topicRecords = Object.values(latestTopicRecordsBySession);
  const latestTopicRecord = topicRecords.reduce<LessonAssessmentRecord | null>(
    (latest, record) => pickLatestAssessmentRecord(latest, record),
    null,
  );
  const finalExamRecord = scopedRecords
    .filter((record) => record.assessment_type === 'final_exam')
    .reduce<LessonAssessmentRecord | null>((latest, record) => pickLatestAssessmentRecord(latest, record), null);

  return {
    topicCount: topicRecords.length,
    latestTopicRecord,
    finalExamRecord,
    recentRecords: scopedRecords
      .slice()
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .slice(0, 3),
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, changePassword, signOut } = useAuth();
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL;
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [ownerConsultations, setOwnerConsultations] = useState<Consultation[]>([]);
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);
  const [lessonAssessments, setLessonAssessments] = useState<LessonAssessmentRecord[]>([]);
  const [ownerLessonAssessments, setOwnerLessonAssessments] = useState<LessonAssessmentRecord[]>([]);
  const [ownerLessonActivities, setOwnerLessonActivities] = useState<LessonActivityRecord[]>([]);
  const [activityNowMs, setActivityNowMs] = useState(() => Date.now());
  const [loadingData, setLoadingData] = useState(true);
  const [showRevokedClasses, setShowRevokedClasses] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const [ownerInboxError, setOwnerInboxError] = useState('');

  const [consultationFeedback, setConsultationFeedback] = useState<Record<string, 'none' | 'gmail' | 'whatsapp'>>({});
  const [selectedCourse, setSelectedCourse] = useState<Record<string, string>>({});
  const [selectedSession, setSelectedSession] = useState<Record<string, string>>({});
  const [certificationStarted, setCertificationStarted] = useState<Record<string, boolean>>({});
  const [activeLessonConsultationId, setActiveLessonConsultationId] = useState<string | null>(null);

  const certificationCatalog: Record<string, {title: string; description: string; sessions: string[]}> = {
    [IT_SUPPORT_CUSTOMER_CARE_COURSE]: IT_SUPPORT_CUSTOMER_CARE_TRACK,
    'Database Systems': {
      title: 'Database Systems Certification',
      description: 'Comprehensive database theory, relational design, and admin skills.',
      sessions: [
        'Introduction to Databases (1h)',
        'Data Modeling & ERD (1h 30m)',
        'SQL Basics & Advanced Queries (1h 30m)',
        'Database Design Principles (1h)',
        'Indexing & Optimization (1h)',
        'Transactions & Concurrency (1h)',
        'Stored Procedures & Views (1h)',
        'Database Security & Access Control (1h)',
        'Distributed Databases & Replication (1h 30m)',
        'Backup & Recovery (1h)',
        'Database Administration & Monitoring (1h)',
      ],
    },
    'Data Communications & Networks': {
      title: 'Data Communications & Networks Certification',
      description: 'Core networking curriculum for routing, switching, and protocols.',
      sessions: [
        'Networking Fundamentals (1h)',
        'TCP/IP & OSI Models (1h 30m)',
        'Routing & Switching (1h 30m)',
        'IP Addressing & Subnetting (1h 30m)',
        'Network Devices & Media (1h)',
        'Network Security (1h)',
        'Wireless & WAN Technologies (1h 30m)',
        'Network Services & Protocols (1h)',
        'Network Management & Troubleshooting (1h 30m)',
        'Network Design Project (1h)',
      ],
    },
    'Distributed Systems': {
      title: 'Distributed Systems Certification',
      description: 'Cloud and distributed computing concepts for modern systems.',
      sessions: [
        'Distributed System Concepts (1h)',
        'Consensus & Fault Tolerance (1h 30m)',
        'Microservices Architecture (1h)',
        'Scalability & Load Balancing (1h 30m)',
        'Distributed Communication Patterns (1h)',
        'Distributed Data Management (1h 30m)',
        'Cloud Infrastructure Basics (1h)',
        'Containerization & Orchestration (1h 30m)',
        'Observability & Monitoring (1h)',
        'Distributed Systems Capstone (1h)',
      ],
    },
    'Data Structures & Algorithms': {
      title: 'Data Structures & Algorithms Certification',
      description: 'Core algorithmic thinking, data organization, and performance analysis for computing students.',
      sessions: [
        'Introduction to Data Structures (1h)',
        'Arrays & Linked Lists (1h 30m)',
        'Stacks & Queues (1h)',
        'Trees & Binary Search Trees (1h 30m)',
        'Heaps & Priority Queues (1h)',
        'Hash Tables & Dictionaries (1h)',
        'Algorithm Analysis & Big O (1h 30m)',
        'Searching & Sorting Techniques (1h 30m)',
        'Recursion & Divide and Conquer (1h)',
        'Graph Algorithms Fundamentals (1h 30m)',
      ],
    },
    'Operating Systems': {
      title: 'Operating Systems Certification',
      description: 'Systems-level computing concepts covering processes, memory, storage, and OS protection.',
      sessions: [
        'Introduction to Operating Systems (1h)',
        'Processes & Threads (1h 30m)',
        'CPU Scheduling (1h)',
        'Process Synchronization (1h 30m)',
        'Deadlocks & Resource Allocation (1h)',
        'Memory Management (1h 30m)',
        'Virtual Memory (1h)',
        'File Systems & Storage (1h 30m)',
        'Device Management & I/O (1h)',
        'OS Security & Protection (1h)',
      ],
    },
    'Software Engineering': {
      title: 'Software Engineering Certification',
      description: 'A full software engineering track from requirements to maintenance and team delivery.',
      sessions: [
        'Introduction to Software Engineering (1h)',
        'Software Development Life Cycle (1h 30m)',
        'Requirements Engineering (1h 30m)',
        'Software Design & Architecture (1h 30m)',
        'Agile & Project Management (1h)',
        'Version Control & Collaboration (1h)',
        'Software Testing Fundamentals (1h 30m)',
        'Software Quality Assurance (1h)',
        'Maintenance & Evolution (1h)',
        'Software Engineering Capstone (1h)',
      ],
    },
    'Web Development': {
      title: 'Web Development Certification',
      description: 'Frontend, backend, authentication, persistence, and deployment for modern web systems.',
      sessions: [
        'Introduction to Web Development (1h)',
        'HTML & Semantic Structure (1h)',
        'CSS Layout & Responsive Design (1h 30m)',
        'JavaScript Fundamentals (1h 30m)',
        'Frontend Framework Concepts (1h)',
        'Backend Development Basics (1h 30m)',
        'Web Databases & Persistence (1h)',
        'Authentication & Authorization (1h)',
        'Deployment & Hosting (1h)',
        'Web Development Capstone (1h)',
      ],
    },
    'Computer Security': {
      title: 'Computer Security Certification',
      description: 'Security foundations, secure systems, monitoring, and governance across computer platforms.',
      sessions: [
        'Introduction to Computer Security (1h)',
        'Cryptography Fundamentals (1h 30m)',
        'Authentication & Access Control (1h)',
        'Network Security Principles (1h 30m)',
        'Web Application Security (1h 30m)',
        'System Hardening & Endpoint Security (1h)',
        'Security Monitoring & Incident Response (1h 30m)',
        'Digital Forensics Basics (1h)',
        'Security Policy, Risk & Governance (1h)',
        'Computer Security Capstone (1h)',
      ],
    },
    // Add additional computer science track courses as needed.
  };

  const buildGenericTrackSessions = (courseTitle: string) => [
    `Introduction to ${courseTitle} (1h)`,
    `${courseTitle} Foundations (1h 30m)`,
    `${courseTitle} Core Components (1h 30m)`,
    `${courseTitle} Design & Architecture (1h 30m)`,
    `${courseTitle} Methods & Techniques (1h)`,
    `${courseTitle} Implementation Practice (1h 30m)`,
    `${courseTitle} Analysis & Troubleshooting (1h)`,
    `${courseTitle} Security & Best Practices (1h)`,
    `${courseTitle} Applications & Case Studies (1h 30m)`,
    `${courseTitle} Capstone Review (1h)`,
  ];

  const getCertificationTrack = (courseTitle: string) => {
    if (!courseTitle) {
      return {
        title: 'Select a course',
        description: 'Choose a course to load its structured certification path.',
        sessions: [] as string[],
      };
    }
    const existing = certificationCatalog[courseTitle];
    if (existing) return existing;
    return {
      title: `${courseTitle} Certification`,
      description: `A structured ${courseTitle} learning path with topic-to-subtopic progression, lab-style practice, and review checkpoints.`,
      sessions: buildGenericTrackSessions(courseTitle),
    };
  };

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: '', username: '', phone: '', recovery_email: '', bio: '', company: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Settings
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [manualResetEmail, setManualResetEmail] = useState('');
  const [manualResetError, setManualResetError] = useState('');
  const [manualResetCode, setManualResetCode] = useState('');
  const [manualResetExpiresAt, setManualResetExpiresAt] = useState('');
  const [manualResetGenerating, setManualResetGenerating] = useState(false);

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) return;
    const silent = Boolean(options?.silent);
    if (!silent) {
      setLoadingData(true);
      setDashboardError('');
      setOwnerInboxError('');
    }

    const [consResult, savedResult, ownerResult, lessonResult, ownerLessonResult, ownerActivityResult] = await Promise.allSettled([
      api.getConsultations(),
      api.getSavedServices(),
      isOwner ? api.getAdminConsultations() : Promise.resolve(null),
      isOwner ? Promise.resolve(null) : api.getLessonAssessments(),
      isOwner ? api.getAdminLessonAssessments() : Promise.resolve(null),
      isOwner ? api.getAdminLessonActivities() : Promise.resolve(null),
    ]);

    if (consResult.status === 'fulfilled') {
      setConsultations(consResult.value.consultations);
    } else {
      console.error('Error fetching consultations:', consResult.reason);
      setConsultations([]);
      setDashboardError(consResult.reason instanceof Error ? consResult.reason.message : 'Could not load consultations.');
    }

    if (savedResult.status === 'fulfilled') {
      setSavedServices(savedResult.value.savedServices);
    } else {
      console.error('Error fetching saved services:', savedResult.reason);
      setSavedServices([]);
      setDashboardError(prev => prev || (savedResult.reason instanceof Error ? savedResult.reason.message : 'Could not load saved services.'));
    }

    if (ownerResult.status === 'fulfilled') {
      setOwnerConsultations(ownerResult.value?.consultations || []);
    } else if (isOwner) {
      console.error('Error fetching owner consultations:', ownerResult.reason);
      setOwnerConsultations([]);
      setOwnerInboxError(ownerResult.reason instanceof Error ? ownerResult.reason.message : 'Could not load the client inbox.');
    }

    if (lessonResult.status === 'fulfilled') {
      setLessonAssessments(lessonResult.value?.records || []);
    } else if (!isOwner) {
      console.error('Error fetching lesson assessments:', lessonResult.reason);
      setLessonAssessments([]);
      setDashboardError(prev => prev || (lessonResult.reason instanceof Error ? lessonResult.reason.message : 'Could not load lesson assessments.'));
    }

    if (ownerLessonResult.status === 'fulfilled') {
      setOwnerLessonAssessments(ownerLessonResult.value?.records || []);
    } else if (isOwner) {
      console.error('Error fetching owner lesson assessments:', ownerLessonResult.reason);
      setOwnerLessonAssessments([]);
      setOwnerInboxError(prev => prev || (ownerLessonResult.reason instanceof Error ? ownerLessonResult.reason.message : 'Could not load lesson assessment records.'));
    }

    if (ownerActivityResult.status === 'fulfilled') {
      setOwnerLessonActivities(ownerActivityResult.value?.records || []);
    } else if (isOwner) {
      console.error('Error fetching lesson activity records:', ownerActivityResult.reason);
      setOwnerLessonActivities([]);
      setOwnerInboxError(prev => prev || (ownerActivityResult.reason instanceof Error ? ownerActivityResult.reason.message : 'Could not load lesson activity records.'));
    }

    if (!silent) {
      setLoadingData(false);
    }
  }, [user, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    const refreshInterval = window.setInterval(() => {
      fetchData({ silent: true });
    }, 15000);

    return () => window.clearInterval(refreshInterval);
  }, [fetchData, isOwner]);

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    const timerInterval = window.setInterval(() => {
      setActivityNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerInterval);
  }, [isOwner]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        recovery_email: profile.recovery_email || '',
        bio: profile.bio || '',
        company: profile.company || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'consultations') {
      fetchData();
    }
  }, [activeTab, fetchData]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    const { error } = await updateProfile(profileForm);
    setProfileSaving(false);
    if (!error) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      const { error } = await changePassword(newPassword);
      if (error) setPasswordError(error);
      else {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err, 'Error changing password'));
    }
    setChangingPassword(false);
  };

  const handleRemoveSaved = async (id: string) => {
    try {
      await api.deleteSavedService(id);
      setSavedServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error removing saved service:', err);
    }
  };

  const handleConsultationStatusChange = async (id: string, status: ConsultationStatus) => {
    setStatusUpdatingId(id);
    try {
      const { consultation } = await api.updateConsultationStatus(id, status);
      setOwnerConsultations(prev => prev.map(item => (item.id === id ? consultation : item)));
      setConsultations(prev => prev.map(item => (item.id === id ? consultation : item)));
    } catch (err) {
      console.error('Error updating consultation status:', err);
    }
    setStatusUpdatingId(null);
  };

  const syncConsultation = (consultation: Consultation) => {
    setOwnerConsultations(prev => prev.map(item => (item.id === consultation.id ? consultation : item)));
    setConsultations(prev => prev.map(item => (item.id === consultation.id ? consultation : item)));
  };

  const handleConsultationWorkflowChange = async (consultation: Consultation, nextPath: 'service' | 'class') => {
    setStatusUpdatingId(consultation.id);
    try {
      const update = await api.updateConsultationWorkflow(consultation.id, {
        next_path: nextPath,
        next_path_status: 'pending',
        owner_agreed: consultation.owner_agreed,
      });
      syncConsultation(update.consultation);
    } catch (err) {
      console.error('Error updating consultation workflow:', err);
    }
    setStatusUpdatingId(null);
  };

  const handleConsultationPaymentStatusChange = async (id: string, paymentStatus: ConsultationPaymentStatus) => {
    setStatusUpdatingId(id);
    try {
      const { consultation } = await api.updateConsultationPayment(id, { payment_status: paymentStatus });
      syncConsultation(consultation);
    } catch (err) {
      console.error('Error updating consultation payment status:', err);
    }
    setStatusUpdatingId(null);
  };

  const handleApproveConsultation = async (consultation: Consultation) => {
    if (consultation.payment_status !== 'paid') return;

    setStatusUpdatingId(consultation.id);
    try {
      const { consultation: updatedConsultation } = await api.updateConsultationWorkflow(consultation.id, {
        next_path: consultation.next_path || 'service',
        next_path_status: consultation.next_path_status || 'pending',
        owner_agreed: 'yes',
        manual_access_granted: 'no',
      });
      syncConsultation(updatedConsultation);
    } catch (err) {
      console.error('Error approving consultation:', err);
    }
    setStatusUpdatingId(null);
  };

  const handleGrantManualAccess = async (consultation: Consultation) => {
    setStatusUpdatingId(consultation.id);
    try {
      const { consultation: updatedConsultation } = await api.updateConsultationWorkflow(consultation.id, {
        next_path: consultation.next_path || 'class',
        next_path_status: consultation.next_path_status || 'pending',
        owner_agreed: 'yes',
        manual_access_granted: 'yes',
      });
      syncConsultation(updatedConsultation);
    } catch (err) {
      console.error('Error granting manual access:', err);
    }
    setStatusUpdatingId(null);
  };

  const handleStartClassTest = async (id: string) => {
    setStatusUpdatingId(id);
    try {
      const update = await api.updateConsultationWorkflow(id, {
        next_path: 'class',
        next_path_status: 'test_in_progress',
        owner_agreed: 'yes',
      });
      syncConsultation(update.consultation);
      setTimeout(async () => {
        const completedUpdate = await api.updateConsultationWorkflow(id, {
          next_path: 'class',
          next_path_status: 'test_completed',
          owner_agreed: 'yes',
        });
        syncConsultation(completedUpdate.consultation);
      }, 800);
    } catch (err) {
      console.error('Error starting class test:', err);
    }
    setStatusUpdatingId(null);
  };

  const handleProceedToCertification = async (id: string) => {
    setStatusUpdatingId(id);
    try {
      const update = await api.updateConsultationWorkflow(id, {
        next_path: 'class',
        next_path_status: 'certification_started',
        owner_agreed: 'yes',
      });
      syncConsultation(update.consultation);
    } catch (err) {
      console.error('Error proceeding to certification:', err);
    }
    setStatusUpdatingId(null);
  };

  const handleClassLifecycleChange = async (
    consultation: Consultation,
    nextPathStatus: ConsultationNextPathStatus,
    ownerAgreed: 'yes' | 'no',
  ) => {
    setStatusUpdatingId(consultation.id);
    try {
      const update = await api.updateConsultationWorkflow(consultation.id, {
        next_path: 'class',
        next_path_status: nextPathStatus,
        owner_agreed: ownerAgreed,
      });
      syncConsultation(update.consultation);
    } catch (err) {
      console.error('Error updating class lifecycle:', err);
    }
    setStatusUpdatingId(null);
  };

  const handleManualResetGenerate = async () => {
    const normalizedEmail = manualResetEmail.trim().toLowerCase();
    setManualResetError('');
    setManualResetCode('');
    setManualResetExpiresAt('');

    if (!normalizedEmail) {
      setManualResetError('User email is required');
      return;
    }

    setManualResetGenerating(true);
    try {
      const result = await api.createManualPasswordReset(normalizedEmail);
      setManualResetEmail(result.email);
      setManualResetCode(result.otp);
      setManualResetExpiresAt(result.expiresAt);
    } catch (err: unknown) {
      setManualResetError(getErrorMessage(err, 'Could not generate a manual reset code.'));
    } finally {
      setManualResetGenerating(false);
    }
  };

  const openGmailReply = async (consultation: Consultation) => {
    setConsultationFeedback(prev => ({ ...prev, [consultation.id]: 'gmail' }));

    try {
      const response = await api.updateConsultationWorkflow(consultation.id, {
        next_path: consultation.next_path === 'class' ? 'class' : 'service',
        next_path_status: consultation.next_path_status || 'pending',
        owner_agreed: consultation.owner_agreed || 'no',
      });
      syncConsultation(response.consultation);
    } catch (err) {
      console.error('Error setting consultation agreement:', err);
    }

    const subject = encodeURIComponent(`Re: ${consultation.service} consultation`);
    const body = encodeURIComponent(
      `Hello ${consultation.full_name},\n\nThank you for reaching out to Expert Tech Solutions & Training.\n\nI am following up on your ${consultation.service} consultation request.\n\nBest regards,\nKeith Chege Junior\n${OWNER_EMAIL}`
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(consultation.email)}&su=${subject}&body=${body}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const openWhatsApp = async (consultation: Consultation) => {
    if (!consultation.phone) return;
    const phoneNumber = consultation.phone.replace(/\D/g, '');
    if (!phoneNumber) return;

    setConsultationFeedback(prev => ({ ...prev, [consultation.id]: 'whatsapp' }));

    try {
      const response = await api.updateConsultationWorkflow(consultation.id, {
        next_path: consultation.next_path === 'class' ? 'class' : 'service',
        next_path_status: consultation.next_path_status || 'pending',
        owner_agreed: consultation.owner_agreed || 'no',
      });
      syncConsultation(response.consultation);
    } catch (err) {
      console.error('Error setting consultation agreement:', err);
    }

    const message = encodeURIComponent(
      `Hello ${consultation.full_name}, this is Keith from Expert Tech Solutions & Training. I am following up on your ${consultation.service} consultation request.`
    );

    window.open(
      `https://wa.me/${phoneNumber}?text=${message}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const inboxConsultations = isOwner ? ownerConsultations : consultations;
  const overviewConsultations = isOwner ? ownerConsultations : consultations;
  const currentLessonRecords = isOwner ? ownerLessonAssessments : lessonAssessments;
  const ownerOngoingClasses = ownerConsultations.filter(
    (consultation) =>
      consultation.next_path === 'class' &&
      consultation.owner_agreed === 'yes' &&
      consultation.status !== 'cancelled' &&
      consultation.next_path_status !== 'revoked' &&
      consultation.next_path_status !== 'terminated',
  );
  const ownerRevokedClasses = ownerConsultations.filter(
    (consultation) =>
      consultation.next_path === 'class' &&
      consultation.next_path_status === 'revoked' &&
      consultation.status !== 'cancelled',
  );
  const ownerLatestLessonActivityByConsultation = ownerLessonActivities.reduce<Record<string, LessonActivityRecord>>((acc, record) => {
    const existing = acc[record.consultation_id];
    if (!existing || new Date(record.last_seen_at).getTime() > new Date(existing.last_seen_at).getTime()) {
      acc[record.consultation_id] = record;
    }
    return acc;
  }, {});
  const ownerActiveLessonCount = ownerOngoingClasses.filter((consultation) => {
    const record = ownerLatestLessonActivityByConsultation[consultation.id];
    return record && activityNowMs - new Date(record.last_seen_at).getTime() <= 60000;
  }).length;

  const learnerApprovedClassConsultation = !isOwner
    ? consultations
        .filter(
          (consultation) =>
            consultation.next_path === 'class' &&
            consultation.owner_agreed === 'yes' &&
            consultation.status !== 'cancelled' &&
            consultation.next_path_status !== 'revoked' &&
            consultation.next_path_status !== 'terminated',
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : undefined;
  const learnerApprovedCourseTitle = learnerApprovedClassConsultation
    ? resolveCertificationCourseTitle(learnerApprovedClassConsultation.service) || learnerApprovedClassConsultation.service
    : null;

  const activeCertificationConsultation = !isOwner
    ? consultations.find(
        c =>
          c.next_path === 'class' &&
          c.next_path_status === 'certification_started' &&
          c.owner_agreed === 'yes' &&
          (c.payment_status === 'paid' || c.manual_access_granted === 'yes') &&
          c.status !== 'cancelled' &&
          c.next_path_status !== 'revoked' &&
          c.next_path_status !== 'terminated',
      )
    : undefined;
  const activatedCourseTitle = activeCertificationConsultation
    ? resolveCertificationCourseTitle(activeCertificationConsultation.service)
    : null;

  const getSessionAccessForConsultation = (consultationId: string, courseTitle: string) => {
    const track = getCertificationTrack(courseTitle);
    return buildSessionAccessList(track.sessions, currentLessonRecords, consultationId, courseTitle);
  };

  const getAssessmentSummaryForConsultation = (consultationId: string) => {
    return getConsultationAssessmentSummary(isOwner ? ownerLessonAssessments : lessonAssessments, consultationId);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.username?.slice(0, 2).toUpperCase() || 'U';

  const tabs: { id: DashTab; label: string; icon: JSX.Element }[] = [
    { id: 'overview', label: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { id: 'consultations', label: 'Consultations', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id: 'saved', label: 'Saved Services', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
    { id: 'profile', label: 'Profile', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: 'settings', label: 'Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];

  if (isOwner) {
    tabs.splice(2, 0, {
      id: 'inbox',
      label: 'Client Inbox',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    });
  }

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{profile?.full_name || profile?.username || 'User'}</span>
              </h1>
              <p className="text-blue-200/50 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>
        {!isOwner && activeCertificationConsultation && (
          <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-6 text-white">
            <h3 className="text-lg font-bold mb-1">Certification Curriculum</h3>
            <p className="text-sm text-indigo-200 mb-4">
              Your provider activated the <span className="font-semibold">{activeCertificationConsultation.service}</span> certification path.
              {activatedCourseTitle ? (
                <> You can now begin <span className="font-semibold">{getCertificationTrack(activatedCourseTitle).title}</span>.</>
              ) : (
                <> This class stays locked until admin assigns the exact approved course path.</>
              )}
            </p>

            {!activatedCourseTitle ? (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                Access is blocked until admin approves and assigns the exact course for this learner. Users cannot choose courses on their own.
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-cyan-300">
                    {getCertificationTrack(activatedCourseTitle).title}
                  </span>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-300">
                    {getCertificationTrack(activatedCourseTitle).description}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-indigo-300 mb-3 font-medium">Select a session to start learning:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {getSessionAccessForConsultation(
                      activeCertificationConsultation.id,
                      activatedCourseTitle,
                    ).map((item) => {
                      const session = `${item.isCompleted ? `Done ${item.score}%` : item.isUnlocked ? 'Open' : 'Locked'} - ${item.session}`;
                      return (
                      <button
                        key={item.session}
                        onClick={() => {
                          if (!item.isUnlocked) return;
                          sessionStorage.setItem(`lesson_${activeCertificationConsultation.id}`, JSON.stringify({
                            course: activatedCourseTitle,
                            session: item.session
                          }));
                          navigate(
                            `/lesson/${activeCertificationConsultation.id}?course=${encodeURIComponent(activatedCourseTitle)}&session=${encodeURIComponent(item.session)}`
                          );
                        }}
                        disabled={!item.isUnlocked}
                        className={`text-left p-3 rounded-lg border transition-all font-medium text-sm ${
                          item.isCompleted
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            : item.isUnlocked
                              ? 'border-green-400/40 bg-green-500/10 text-green-300 hover:bg-green-500/20'
                              : 'border-white/10 bg-white/5 text-blue-200/40 cursor-not-allowed'
                        }`}
                      >
                        {session}
                      </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-blue-200/60">Complete the current topic quiz before the next session unlocks.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-blue-200/60 hover:text-white hover:bg-white/5'
              }`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>
        ) : (
          <>
            {dashboardError && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {dashboardError}
              </div>
            )}

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: isOwner ? 'Client Consultations' : 'Total Consultations', value: overviewConsultations.length, color: 'from-cyan-400 to-blue-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                    { label: 'Pending', value: overviewConsultations.filter(c => c.status === 'pending').length, color: 'from-amber-400 to-orange-500', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                    { label: 'Completed', value: overviewConsultations.filter(c => c.status === 'completed').length, color: 'from-green-400 to-emerald-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                    isOwner
                      ? { label: 'Ongoing Classes', value: ownerOngoingClasses.length, color: 'from-emerald-400 to-cyan-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
                      : { label: 'Saved Services', value: savedServices.length, color: 'from-purple-400 to-pink-600', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                          {stat.icon}
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                      <p className="text-blue-200/40 text-sm mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {isOwner && (
                  <div>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">Ongoing Classes</h3>
                        <p className="text-sm text-blue-200/40">
                          Approved class requests that are active right now. Admin can revoke access or terminate the class from here.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        Active classes: <span className="font-semibold text-white">{ownerOngoingClasses.length}</span>
                        <span className="mx-2 text-emerald-300/50">|</span>
                        Live now: <span className="font-semibold text-white">{ownerActiveLessonCount}</span>
                      </div>
                    </div>

                    <div className="mb-4 flex justify-end">
                      <button
                        onClick={() => setShowRevokedClasses((prev) => !prev)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                          showRevokedClasses
                            ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                            : 'border-white/10 bg-white/5 text-blue-100/80 hover:bg-white/10'
                        }`}
                      >
                        {showRevokedClasses ? 'Hide revoked classes' : `View revoked classes (${ownerRevokedClasses.length})`}
                      </button>
                    </div>

                    {ownerOngoingClasses.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                        <p className="text-blue-200/40">No ongoing classes at the moment.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ownerOngoingClasses.map((consultation) => {
                          const summary = getAssessmentSummaryForConsultation(consultation.id);
                          const lessonActivity = ownerLatestLessonActivityByConsultation[consultation.id];
                          const isLessonLive = lessonActivity && activityNowMs - new Date(lessonActivity.last_seen_at).getTime() <= 60000;
                          const displayedElapsedSeconds = lessonActivity ? getLiveElapsedSeconds(lessonActivity, activityNowMs) : 0;
                          return (
                            <div key={consultation.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <h4 className="text-white font-bold text-lg">{consultation.service}</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${classWorkflowColors[consultation.next_path_status || 'pending']}`}>
                                      {getClassWorkflowLabel(consultation.next_path_status || 'pending')}
                                    </span>
                                    {lessonActivity && (
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isLessonLive ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-white/5 text-blue-200/70'}`}>
                                        {isLessonLive ? 'Live now' : 'Recent lesson activity'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-blue-200/60">
                                    {consultation.full_name} • {consultation.email}
                                  </p>
                                  <p className="text-xs text-blue-200/45">
                                    Started from consultation on {new Date(consultation.created_at).toLocaleString()}
                                  </p>
                                  {lessonActivity && (
                                    <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100">
                                      <p>
                                        Current lesson: <span className="font-semibold text-white">{lessonActivity.session_label}</span>
                                      </p>
                                      <p className="mt-1">
                                        Reading timer: <span className="font-semibold text-white">{formatElapsedDuration(displayedElapsedSeconds)}</span>
                                        {' / '}
                                        <span className="font-semibold text-white">{formatElapsedDuration(lessonActivity.required_seconds)}</span>
                                      </p>
                                      <p className="mt-1 text-xs text-cyan-100/70">
                                        Last seen {new Date(lessonActivity.last_seen_at).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  <p className="text-sm text-blue-100/80">
                                    Topic quizzes completed: <span className="font-semibold text-white">{summary.topicCount}</span>
                                    {summary.finalExamRecord ? ` • Final exam: ${summary.finalExamRecord.score}%` : ' • Final exam pending'}
                                  </p>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
                                  <button
                                    onClick={() => handleClassLifecycleChange(consultation, 'revoked', 'no')}
                                    disabled={statusUpdatingId === consultation.id}
                                    className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition-all hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {statusUpdatingId === consultation.id ? 'Updating...' : 'Revoke Class Access'}
                                  </button>
                                  <button
                                    onClick={() => handleClassLifecycleChange(consultation, 'terminated', 'no')}
                                    disabled={statusUpdatingId === consultation.id}
                                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {statusUpdatingId === consultation.id ? 'Updating...' : 'Terminate Class'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {showRevokedClasses && (
                      <div className="mt-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-white">Revoked Classes</h4>
                            <p className="text-sm text-blue-200/40">
                              Classes that were revoked by admin and are no longer active.
                            </p>
                          </div>
                          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                            Revoked: <span className="font-semibold text-white">{ownerRevokedClasses.length}</span>
                          </div>
                        </div>

                        {ownerRevokedClasses.length === 0 ? (
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                            <p className="text-blue-200/40">No revoked classes yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {ownerRevokedClasses.map((consultation) => (
                              <div key={consultation.id} className="rounded-2xl border border-amber-400/15 bg-amber-500/5 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <h4 className="text-white font-bold text-lg">{consultation.service}</h4>
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${classWorkflowColors[consultation.next_path_status || 'revoked']}`}>
                                        {getClassWorkflowLabel(consultation.next_path_status || 'revoked')}
                                      </span>
                                    </div>
                                    <p className="text-sm text-blue-200/60">
                                      {consultation.full_name} • {consultation.email}
                                    </p>
                                    <p className="text-xs text-blue-200/45">
                                      Revoked after consultation on {new Date(consultation.created_at).toLocaleString()}
                                    </p>
                                  </div>

                                  <div className="grid gap-2 sm:grid-cols-1 lg:w-[220px]">
                                    <button
                                      onClick={() => handleClassLifecycleChange(consultation, 'certification_started', 'yes')}
                                      disabled={statusUpdatingId === consultation.id}
                                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {statusUpdatingId === consultation.id ? 'Updating...' : 'Restore class access'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Recent consultations */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">{isOwner ? 'Latest Client Consultations' : 'Recent Consultations'}</h3>
                  {overviewConsultations.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                      <p className="text-blue-200/40">{isOwner ? 'No client consultations yet.' : 'No consultations yet. Submit your first inquiry!'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overviewConsultations.slice(0, 5).map(c => (
                        <div key={c.id} className="space-y-2">
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.07] transition-all">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{c.service}</p>
                              <p className="text-blue-200/40 text-sm truncate">
                                {isOwner ? `${c.full_name} · ${c.message}` : c.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[c.status] || statusColors.pending}`}>
                                {c.status.replace('_', ' ')}
                              </span>
                              <span className="text-blue-200/30 text-xs whitespace-nowrap">
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {!isOwner && (
                            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                              {c.payment_status === 'not_requested' && 'Your request has been submitted and is waiting for admin review.'}
                              {c.payment_status === 'awaiting_payment' && 'Admin reviewed your request. Complete payment to continue to approval.'}
                              {c.payment_status === 'paid' && c.owner_agreed !== 'yes' && 'Payment has been received. Your request is awaiting final admin approval.'}
                              {c.owner_agreed === 'yes' && `Your request is approved for the ${c.next_path === 'class' ? 'training path' : 'service path'}${c.manual_access_granted === 'yes' ? ' by admin override.' : ' after payment approval.'}`}
                              {c.next_path_status === 'revoked' && ' Class access has been revoked by admin.'}
                              {c.next_path_status === 'terminated' && ' This class has been terminated by admin.'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Certification Access</h3>
                      <p className="text-sm text-blue-200/40">Only your single approved class is active here.</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                      Active class: <span className="font-semibold text-white">{learnerApprovedCourseTitle || 'None yet'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(certificationCatalog).map(([courseKey, course]) => {
                      const isActiveCourse = Boolean(
                        learnerApprovedClassConsultation && matchesCourseTitle(learnerApprovedClassConsultation, courseKey),
                      );

                      return (
                        <div
                          key={courseKey}
                          className={`rounded-2xl border p-5 transition-all ${
                            isActiveCourse
                              ? 'border-emerald-400/30 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                                {course.sessions.length} sessions
                              </p>
                              <h4 className="mt-2 text-lg font-bold text-white">{course.title}</h4>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                                isActiveCourse
                                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                                  : 'border-white/10 bg-white/5 text-blue-200/60'
                              }`}
                            >
                              {isActiveCourse ? 'Active' : 'Locked'}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-blue-200/70">{course.description}</p>

                          <button
                            onClick={() => {
                              if (!isActiveCourse) return;
                              navigate('/training-education');
                            }}
                            disabled={!isActiveCourse}
                            className={`mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                              isActiveCourse
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500'
                                : 'cursor-not-allowed border border-white/10 bg-white/5 text-blue-200/40'
                            }`}
                          >
                            {isActiveCourse ? 'Continue active class' : 'Locked until approved'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* OWNER INBOX */}
            {activeTab === 'inbox' && isOwner && (
              <div className="space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Client Inbox</h3>
                    <p className="text-sm text-blue-200/40">
                      Every consultation is saved in SQLite and can be followed up by email or WhatsApp.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                    Replies go through <span className="font-semibold text-white">{OWNER_EMAIL}</span>
                  </div>
                </div>

                {ownerInboxError && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {ownerInboxError} Check that the deployed backend has the correct owner email and API configuration.
                  </div>
                )}

                {inboxConsultations.length === 0 && !ownerInboxError ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300/30"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <p className="text-blue-200/40 text-lg mb-2">No client consultations yet</p>
                    <p className="text-blue-200/30 text-sm">New consultation requests will appear here for follow-up.</p>
                  </div>
                ) : !ownerInboxError ? (
                  <div className="space-y-4">
                    {inboxConsultations.map(c => (
                      <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-white font-bold text-lg">{c.service}</h4>
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                  {getRequestTypeLabel(c.request_type)}
                                </span>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusColors[c.status] || statusColors.pending}`}>
                                  {c.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-blue-200/40 text-sm mt-1">
                                {new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            <p className="text-blue-200/70 font-medium">{c.full_name}</p>
                            <p className="text-blue-200/60 text-sm leading-relaxed">{c.message}</p>

                            <div className="rounded-2xl border border-white/10 bg-[#0c1d34] p-4 text-sm text-blue-100">
                              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 mb-2">Agreement & Verification</p>
                              <p>
                                Signed by <span className="font-semibold text-white">{c.signature_name || c.full_name}</span>
                                {c.signed_at ? ` on ${new Date(c.signed_at).toLocaleString()}` : ''}.
                              </p>
                              <p className="mt-2 text-blue-200/70">
                                Terms version: {c.terms_version} • Agreement accepted: {c.agreement_accepted ? 'Yes' : 'No'}
                              </p>
                              {c.latest_payment_reference && (
                                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/80">Payment Verification</p>
                                  <p className="mt-2 text-sm text-white">
                                    Code: <span className="font-semibold">{c.latest_payment_reference}</span>
                                  </p>
                                  <p className="mt-1 text-xs text-emerald-100/70">
                                    {c.latest_payment_method ? `Method: ${c.latest_payment_method.replace('_', ' ')}` : 'Payment reference submitted'}
                                    {c.latest_payment_recorded_at ? ` • Recorded ${new Date(c.latest_payment_recorded_at).toLocaleString()}` : ''}
                                  </p>
                                </div>
                              )}
                              {c.agreement_document && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100">
                                    Signed Agreement
                                  </span>
                                  <span className="text-xs text-blue-200/60">{c.agreement_document.file_name}</span>
                                  <a
                                    href={c.agreement_document.data_url}
                                    download={c.agreement_document.file_name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500/20"
                                  >
                                    View Signed Agreement
                                  </a>
                                </div>
                              )}
                              {c.id_document && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100">
                                    {getDocumentTypeLabel(c.id_document.document_type)}
                                  </span>
                                  <span className="text-xs text-blue-200/60">{c.id_document.file_name}</span>
                                  <a
                                    href={c.id_document.data_url}
                                    download={c.id_document.file_name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500/20"
                                  >
                                    View ID Document
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs text-blue-200/40">
                              <a
                                href={`mailto:${c.email}`}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:border-cyan-500/30 hover:text-white transition-all"
                              >
                                {c.email}
                              </a>
                              {c.phone && (
                                <a
                                  href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:border-cyan-500/30 hover:text-white transition-all"
                                >
                                  {c.phone}
                                </a>
                              )}
                            </div>

                            {(() => {
                              const summary = getAssessmentSummaryForConsultation(c.id);
                              if (!summary.topicCount && !summary.finalExamRecord) {
                                return null;
                              }

                              return (
                                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 mb-2">Learner Progress</p>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                      <p className="text-[11px] uppercase tracking-[0.2em] text-blue-200/60 mb-1">Topic Quizzes</p>
                                      <p className="text-lg font-bold text-white">{summary.topicCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                      <p className="text-[11px] uppercase tracking-[0.2em] text-blue-200/60 mb-1">Final Exam</p>
                                      <p className="text-lg font-bold text-white">{summary.finalExamRecord ? `${summary.finalExamRecord.score}%` : 'Pending'}</p>
                                    </div>
                                  </div>
                                  {summary.latestTopicRecord && (
                                    <p className="text-xs text-blue-100/80 mb-3">
                                      Latest topic: <span className="font-semibold text-white">{summary.latestTopicRecord.session_label}</span> with {summary.latestTopicRecord.score}%.
                                    </p>
                                  )}
                                  <div className="space-y-2">
                                    {summary.recentRecords.map((record) => (
                                      <div key={record.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                        <p className="text-xs font-semibold text-white">{record.session_label}</p>
                                        <p className="text-[11px] text-blue-200/60">
                                          {record.assessment_type === 'final_exam' ? 'Final exam' : 'Topic quiz'} · {record.score}% · {record.correct_answers}/{record.total_questions} correct
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="flex flex-col gap-3 lg:w-[320px]">
                            <button
                              onClick={() => openGmailReply(c)}
                              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-cyan-400 hover:to-blue-500"
                            >
                              Reply in Gmail
                            </button>
                            <button
                              onClick={() => openWhatsApp(c)}
                              disabled={!c.phone}
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {c.phone ? 'WhatsApp Client' : 'No Phone Number'}
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: 'Pending', value: 'pending' },
                                { label: 'In Progress', value: 'in_progress' },
                                { label: 'Completed', value: 'completed' },
                                { label: 'Cancelled', value: 'cancelled' },
                              ].map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => handleConsultationStatusChange(c.id, option.value)}
                                  disabled={statusUpdatingId === c.id || c.status === option.value}
                                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                                    c.status === option.value
                                      ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                                      : 'border-white/10 bg-white/5 text-blue-100 hover:bg-white/10'
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {statusUpdatingId === c.id && c.status !== option.value ? 'Updating...' : option.label}
                                </button>
                              ))}
                            </div>

                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="text-xs text-blue-200/60">Payment status:</span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${paymentStatusColors[c.payment_status || 'not_requested']}`}>
                                  {getPaymentStatusLabel(c.payment_status || 'not_requested')}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="text-xs text-blue-200/60">Approval status:</span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                                  c.owner_agreed === 'yes'
                                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                                }`}>
                                  {c.owner_agreed === 'yes' ? getApprovalStatusLabel(c) : 'Pending'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-2 mb-4">
                                <button
                                  onClick={() => handleConsultationPaymentStatusChange(c.id, 'awaiting_payment')}
                                  disabled={statusUpdatingId === c.id || c.payment_status === 'awaiting_payment' || c.payment_status === 'paid'}
                                  className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition-all hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {statusUpdatingId === c.id ? 'Updating...' : 'Mark as reviewed and request payment'}
                                </button>
                                <button
                                  onClick={() => handleConsultationPaymentStatusChange(c.id, 'paid')}
                                  disabled={statusUpdatingId === c.id || c.payment_status === 'paid'}
                                  className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {statusUpdatingId === c.id ? 'Updating...' : 'Mark payment received'}
                                </button>
                                <button
                                  onClick={() => handleApproveConsultation(c)}
                                  disabled={statusUpdatingId === c.id || c.owner_agreed === 'yes' || c.payment_status !== 'paid'}
                                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition-all hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {c.payment_status !== 'paid'
                                    ? 'Approve request after payment'
                                    : statusUpdatingId === c.id
                                    ? 'Updating...'
                                    : 'Approve request'}
                                </button>
                                <button
                                  onClick={() => handleGrantManualAccess(c)}
                                  disabled={statusUpdatingId === c.id || c.owner_agreed === 'yes'}
                                  className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition-all hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {statusUpdatingId === c.id ? 'Updating...' : 'Grant access without payment'}
                                </button>
                              </div>

                              <label className="block text-xs text-blue-200/60 mb-2">Select path for client</label>
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                  onClick={() => {
                                    handleConsultationWorkflowChange(c, 'service');
                                  }}
                                  className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                                    c.next_path === 'service'
                                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300'
                                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                  }`}
                                >
                                  📦 Service
                                </button>
                                <button
                                  onClick={() => {
                                    handleConsultationWorkflowChange(c, 'class');
                                  }}
                                  className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                                    c.next_path === 'class'
                                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300'
                                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                  }`}
                                >
                                  📚 Certification
                                </button>
                              </div>

                              {c.next_path === 'class' && c.owner_agreed === 'yes' && (
                                <div className="mb-4 rounded-2xl border border-white/10 bg-[#0c1d34] p-4">
                                  <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className="text-xs text-blue-200/60">Class workflow:</span>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${classWorkflowColors[c.next_path_status || 'pending']}`}>
                                      {getClassWorkflowLabel(c.next_path_status || 'pending')}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    <button
                                      onClick={() => handleClassLifecycleChange(c, 'revoked', 'no')}
                                      disabled={statusUpdatingId === c.id}
                                      className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition-all hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {statusUpdatingId === c.id ? 'Updating...' : 'Revoke class access'}
                                    </button>
                                    <button
                                      onClick={() => handleClassLifecycleChange(c, 'terminated', 'no')}
                                      disabled={statusUpdatingId === c.id}
                                      className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {statusUpdatingId === c.id ? 'Updating...' : 'Terminate class'}
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => openGmailReply(c)}
                                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-all"
                                >
                                  📧 Reply via Gmail ∧
                                </button>
                                <button
                                  onClick={() => openWhatsApp(c)}
                                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-all"
                                >
                                  💬 WhatsApp ∧
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {/* CONSULTATIONS */}
            {activeTab === 'consultations' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Consultation History</h3>
                  <button
                    onClick={() => fetchData()}
                    disabled={loadingData}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50"
                  >
                    {loadingData ? 'Syncing...' : 'Refresh'}
                  </button>
                </div>
                {consultations.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300/30"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <p className="text-blue-200/40 text-lg mb-2">No consultations yet</p>
                    <p className="text-blue-200/30 text-sm">Submit a consultation request from the Contact section to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consultations.map(c => (
                      <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-white font-bold text-lg">{c.service}</h4>
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                {getRequestTypeLabel(c.request_type)}
                              </span>
                            </div>
                            <p className="text-blue-200/40 text-sm">{new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusColors[c.status] || statusColors.pending}`}>
                              {c.status.replace('_', ' ')}
                            </span>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${paymentStatusColors[c.payment_status || 'not_requested']}`}>
                              {getPaymentStatusLabel(c.payment_status || 'not_requested')}
                            </span>
                          </div>
                        </div>
                        <p className="text-blue-200/60 text-sm leading-relaxed">{c.message}</p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-blue-200/30">
                          <span>Name: {c.full_name}</span>
                          <span>Email: {c.email}</span>
                          {c.phone && <span>Phone: {c.phone}</span>}
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0c1d34] p-4 text-sm text-blue-100">
                          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 mb-2">Agreement & Verification</p>
                          <p>
                            Signed by <span className="font-semibold text-white">{c.signature_name || c.full_name}</span>
                            {c.signed_at ? ` on ${new Date(c.signed_at).toLocaleString()}` : ''}.
                          </p>
                          <p className="mt-2 text-blue-200/70">
                            Terms version: {c.terms_version} • Agreement accepted: {c.agreement_accepted ? 'Yes' : 'No'}
                          </p>
                          {c.latest_payment_reference && (
                            <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/80">Payment Verification</p>
                              <p className="mt-2 text-sm text-white">
                                Code: <span className="font-semibold">{c.latest_payment_reference}</span>
                              </p>
                              <p className="mt-1 text-xs text-emerald-100/70">
                                {c.latest_payment_method ? `Method: ${c.latest_payment_method.replace('_', ' ')}` : 'Payment reference submitted'}
                                {c.latest_payment_recorded_at ? ` • Recorded ${new Date(c.latest_payment_recorded_at).toLocaleString()}` : ''}
                              </p>
                            </div>
                          )}
                          {c.agreement_document && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100">
                                Signed Agreement
                              </span>
                              <span className="text-xs text-blue-200/60">{c.agreement_document.file_name}</span>
                              <a
                                href={c.agreement_document.data_url}
                                download={c.agreement_document.file_name}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500/20"
                              >
                                View Signed Agreement
                              </a>
                            </div>
                          )}
                          {c.id_document && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100">
                                {getDocumentTypeLabel(c.id_document.document_type)}
                              </span>
                              <span className="text-xs text-blue-200/60">{c.id_document.file_name}</span>
                              <a
                                href={c.id_document.data_url}
                                download={c.id_document.file_name}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-500/20"
                              >
                                View Uploaded ID
                              </a>
                            </div>
                          )}
                        </div>

                        {!isOwner && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-blue-100">
                            {c.payment_status === 'not_requested' && <p>Step 1 complete: request submitted. Wait for admin review before making any payment.</p>}
                            {c.payment_status === 'awaiting_payment' && <p>Admin has reviewed this request. Payment can now be made so the request can move to approval, unless admin grants manual access first.</p>}
                            {c.payment_status === 'paid' && c.owner_agreed !== 'yes' && <p>Payment has been marked as received. Final admin approval is pending.</p>}
                            {c.owner_agreed === 'yes' && <p>Your request has been approved. {c.manual_access_granted === 'yes' ? 'Access was granted directly by admin without payment.' : 'Access was approved after payment verification.'}</p>}
                            {c.next_path_status === 'revoked' && <p>Admin has revoked your class access for this request.</p>}
                            {c.next_path_status === 'terminated' && <p>This class has been terminated by admin.</p>}
                          </div>
                        )}

                        {!isOwner && c.next_path === 'class' && c.payment_status === 'paid' && c.owner_agreed === 'yes' && c.next_path_status !== 'revoked' && c.next_path_status !== 'terminated' && (
                          <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                            <p className="mb-2 font-semibold">Class learning path for this consultation.</p>

                            {c.next_path_status === 'pending' && (
                              <button
                                onClick={() => handleStartClassTest(c.id)}
                                disabled={statusUpdatingId === c.id}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                              >
                                Start class test
                              </button>
                            )}

                            {c.next_path_status === 'test_in_progress' && (
                              <p className="text-xs text-cyan-100">Test in progress… please wait just a moment.</p>
                            )}

                            {c.next_path_status === 'test_completed' && (
                              <button
                                onClick={() => handleProceedToCertification(c.id)}
                                disabled={statusUpdatingId === c.id}
                                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                              >
                                Proceed to Certification Course Introduction
                              </button>
                            )}

                            {c.next_path_status === 'certification_started' && (
                              <>
                                <p className="text-xs text-cyan-100 mb-3">Certification started — choose a course and session.</p>

                                {(() => {
                                  const summary = getAssessmentSummaryForConsultation(c.id);
                                  return summary.topicCount ? (
                                    <div className="mb-3 rounded-xl border border-white/10 bg-[#0b1a33] px-3 py-3 text-xs text-blue-100">
                                      <p className="font-semibold text-cyan-200">Recorded quiz progress</p>
                                      <p className="mt-1 text-blue-200/70">
                                        {summary.topicCount} topic quiz{summary.topicCount === 1 ? '' : 'zes'} recorded
                                        {summary.latestTopicRecord ? `, latest: ${summary.latestTopicRecord.session_label} (${summary.latestTopicRecord.score}%)` : ''}.
                                      </p>
                                    </div>
                                  ) : null;
                                })()}

                                <label className="text-xs text-blue-200/60">Course</label>
                                <select
                                  value={selectedCourse[c.id] || ''}
                                  onChange={e => setSelectedCourse(prev => ({ ...prev, [c.id]: e.target.value }))}
                                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1a33] px-3 py-2 text-sm text-white"
                                >
                                  <option value="">Choose a course</option>
                                  {[c.service].map(key => (
                                    <option key={key} value={key}>{getCertificationTrack(key).title}</option>
                                  ))}
                                </select>

                                {selectedCourse[c.id] && (
                                  <>
                                    <label className="mt-3 block text-xs text-blue-200/60">Session</label>
                                    <select
                                      value={selectedSession[c.id] || ''}
                                      onChange={e => setSelectedSession(prev => ({ ...prev, [c.id]: e.target.value }))}
                                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#0b1a33] px-3 py-2 text-sm text-white"
                                    >
                                      <option value="">Choose a session</option>
                                      {getSessionAccessForConsultation(c.id, selectedCourse[c.id]).map((item) => (
                                        <option key={item.session} value={item.session} disabled={!item.isUnlocked}>
                                          {item.session} {item.isCompleted ? `(Done ${item.score}%)` : item.isUnlocked ? '(Open)' : '(Locked)'}
                                        </option>
                                      ))}
                                    </select>
                                    <p className="mt-2 text-[11px] text-blue-200/60">Only completed topics and the next unlocked topic can be entered.</p>
                                  </>
                                )}

                                <button
                                  onClick={() => {
                                    if (!selectedCourse[c.id] || !selectedSession[c.id]) return;
                                    sessionStorage.setItem(`lesson_${c.id}`, JSON.stringify({ course: selectedCourse[c.id], session: selectedSession[c.id] }));
                                    navigate(
                                      `/lesson/${c.id}?course=${encodeURIComponent(selectedCourse[c.id])}&session=${encodeURIComponent(selectedSession[c.id])}`
                                    );
                                  }}
                                  disabled={!selectedCourse[c.id] || !selectedSession[c.id]}
                                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                                >
                                  Enter AI Lesson
                                </button>
                              </>
                            )}

                            {c.next_path === 'service' && (
                              <p className="text-xs text-blue-200/70">You selected service delivery path; continue with direct implementation and status updates in consultation history.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SAVED SERVICES */}
            {activeTab === 'saved' && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Saved Services</h3>
                {savedServices.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300/30"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <p className="text-blue-200/40 text-lg mb-2">No saved services</p>
                    <p className="text-blue-200/30 text-sm">Browse our services and save the ones you're interested in.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedServices.map(s => (
                      <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-bold">{s.service_title}</h4>
                          <button onClick={() => handleRemoveSaved(s.id)} className="text-blue-200/30 hover:text-red-400 transition-colors p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        <span className="inline-block px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-full mb-2">{s.service_category}</span>
                        <p className="text-blue-200/40 text-sm">{s.service_description}</p>
                        <p className="text-blue-200/20 text-xs mt-3">Saved {new Date(s.saved_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-white mb-6">Edit Profile</h3>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                  {profileSaved && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Profile updated successfully!
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Full Name</label>
                      <input type="text" value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Username</label>
                      <input type="text" value={profileForm.username} onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Phone</label>
                      <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all"
                        placeholder="+254 700 000 000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Recovery Email</label>
                      <input type="email" value={profileForm.recovery_email} onChange={e => setProfileForm(p => ({ ...p, recovery_email: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all"
                        placeholder="recovery@example.com" />
                      <p className="text-blue-200/30 text-xs mt-1">OTP reset codes will be sent to this address.</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Company</label>
                      <input type="text" value={profileForm.company} onChange={e => setProfileForm(p => ({ ...p, company: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all"
                        placeholder="Your company" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Bio</label>
                    <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all resize-none"
                      placeholder="Tell us about yourself..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Email</label>
                    <input type="email" value={user?.email || ''} disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-blue-200/40 cursor-not-allowed" />
                    <p className="text-blue-200/30 text-xs mt-1">Email cannot be changed</p>
                  </div>
                  <button onClick={handleProfileSave} disabled={profileSaving}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-60 flex items-center gap-2">
                    {profileSaving ? (
                      <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    {passwordError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{passwordError}</div>
                    )}
                    {passwordSuccess && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Password changed successfully!
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-blue-200/70 mb-1.5">New Password</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all"
                        placeholder="Min 6 characters" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200/70 mb-1.5">Confirm New Password</label>
                      <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all"
                        placeholder="Re-enter new password" />
                    </div>
                    <button onClick={handlePasswordChange} disabled={changingPassword}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-60 flex items-center gap-2">
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {isOwner && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Manual Password Reset</h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                      <p className="text-blue-200/50 text-sm">
                        Generate a one-time reset code for any user when email delivery is unavailable. Creating a new code replaces the previous one for that email.
                      </p>
                      {manualResetError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                          {manualResetError}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-blue-200/70 mb-1.5">User Email</label>
                        <input
                          type="email"
                          value={manualResetEmail}
                          onChange={e => setManualResetEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:border-cyan-500/50 outline-none transition-all"
                          placeholder="user@example.com"
                        />
                      </div>
                      <button
                        onClick={handleManualResetGenerate}
                        disabled={manualResetGenerating}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-60"
                      >
                        {manualResetGenerating ? 'Generating...' : 'Generate Reset OTP'}
                      </button>
                      {manualResetCode && (
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 space-y-3">
                          <p className="text-amber-200 text-sm">
                            Share this code with the user through a trusted channel, then have them finish the existing reset form.
                          </p>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70 mb-2">Generated OTP</p>
                            <div className="rounded-xl bg-[#0a1628] border border-white/10 px-4 py-3 text-3xl font-bold tracking-[0.35em] text-white">
                              {manualResetCode}
                            </div>
                          </div>
                          <p className="text-sm text-amber-100/80">
                            Expires at {new Date(manualResetExpiresAt).toLocaleString()}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Account Actions</h3>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <p className="text-blue-200/40 text-sm mb-4">Sign out of your account on this device.</p>
                    <button onClick={signOut}
                      className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
