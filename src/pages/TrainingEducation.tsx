import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/site/Navbar';
import ConsultationForm from '@/components/site/ConsultationForm';
import Footer from '@/components/site/Footer';
import ScrollToTop from '@/components/site/ScrollToTop';
import AuthModal from '@/components/site/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { api, type Consultation } from '@/lib/api';
import { resolveCertificationCourseTitle } from '@/lib/certification-paths';
import { IT_SUPPORT_CUSTOMER_CARE_COURSE, IT_SUPPORT_CUSTOMER_CARE_TRACK } from '@/lib/it-support-course';

const certificationCourses = [
  { id: 101, title: IT_SUPPORT_CUSTOMER_CARE_COURSE, description: 'Structured IT support training covering service workflow, troubleshooting, security, and customer care.', image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231252768_6d40d977.jpg' },
  { id: 102, title: 'Database Systems', description: 'Database fundamentals, modeling, SQL, optimization, administration, and security.', image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231253716_7858251c.png' },
  { id: 103, title: 'Data Communications & Networks', description: 'Networking concepts, routing, switching, protocols, services, and troubleshooting.', image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231248426_dda129b9.jpg' },
  { id: 104, title: 'Distributed Systems', description: 'Cloud patterns, scaling, fault tolerance, microservices, and observability.', image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231252768_6d40d977.jpg' },
  { id: 105, title: 'Data Structures & Algorithms', description: 'Core problem-solving, algorithm analysis, trees, graphs, and performance reasoning.', image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231255562_ae94d189.png' },
  { id: 106, title: 'Operating Systems', description: 'Processes, memory, scheduling, storage, synchronization, and OS protection.', image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231252863_addfd50a.jpg' },
  { id: 107, title: 'Software Engineering', description: 'Requirements, design, testing, collaboration, quality, and maintenance for real software teams.', image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231258764_88dba6ea.png' },
  { id: 108, title: 'Web Development', description: 'Frontend, backend, authentication, persistence, deployment, and capstone project flow.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80' },
  { id: 109, title: 'Computer Security', description: 'Security foundations, web security, monitoring, forensics, and governance.', image: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1080&q=80' },
];

const certificationCatalog: Record<string, { sessions: string[] }> = {
  [IT_SUPPORT_CUSTOMER_CARE_COURSE]: { sessions: IT_SUPPORT_CUSTOMER_CARE_TRACK.sessions },
};

function buildGenericTrackSessions(courseTitle: string) {
  return [
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
}

const TrainingEducation: React.FC = () => {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [courseTestStatus, setCourseTestStatus] = useState<Record<number, 'not_started' | 'in_progress' | 'completed'>>({});
  const [courseCertificationStarted, setCourseCertificationStarted] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!user) {
      setConsultations([]);
      return;
    }

    const loadData = async () => {
      const { consultations } = await api.getConsultations();
      setConsultations(consultations);
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <p className="text-blue-200/60 text-sm">Loading training workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal variant="page" />;
  }

  const getTrackSessions = (courseTitle: string) => certificationCatalog[courseTitle]?.sessions || buildGenericTrackSessions(courseTitle);

  const getLatestLearningConsultation = (courseTitle: string) => {
    const classConsultations = consultations
      .filter((consultation) => consultation.next_path === 'class')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return classConsultations.find((consultation) => {
      const resolvedCourseTitle = resolveCertificationCourseTitle(consultation.service);
      return consultation.service === courseTitle || resolvedCourseTitle === courseTitle;
    }) || null;
  };

  const getCourseWorkflowState = (courseTitle: string) => {
    const learningConsultation = getLatestLearningConsultation(courseTitle);
    const approvedForClass = Boolean(learningConsultation && learningConsultation.owner_agreed === 'yes');
    const workflowStatus = learningConsultation?.next_path_status || 'pending';

    return {
      learningConsultation,
      approvedForClass,
      testStatus:
        workflowStatus === 'test_in_progress'
          ? 'in_progress'
          : workflowStatus === 'test_completed' || workflowStatus === 'certification_started'
            ? 'completed'
            : 'not_started',
      certificationStarted: workflowStatus === 'certification_started',
    };
  };

  const handleStartClassTest = (courseId: number) => {
    setCourseTestStatus((prev) => ({ ...prev, [courseId]: 'in_progress' }));
    window.setTimeout(() => {
      setCourseTestStatus((prev) => ({ ...prev, [courseId]: 'completed' }));
    }, 800);
  };

  const handleProceedCertification = (courseId: number, courseTitle: string) => {
    setCourseCertificationStarted((prev) => ({ ...prev, [courseId]: true }));
    const selectedSession = getTrackSessions(courseTitle)[0] || `Introduction to ${courseTitle} (1h)`;
    sessionStorage.setItem(`lesson_service_${courseId}`, JSON.stringify({ course: courseTitle, session: selectedSession }));
    navigate(`/lesson/service-${courseId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Navbar
        onAuthClick={() => {}}
        onDashboardClick={() => navigate('/?view=dashboard')}
        showDashboard={false}
        onHomeClick={() => navigate('/')}
      />

      <main className="pt-28">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0f1d35] to-[#0a1628] py-20">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-4xl">
              <button
                onClick={() => navigate('/')}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-blue-100/80 hover:bg-white/10 hover:text-white"
              >
                Back to services
              </button>
              <div className="mb-4 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                <span className="text-sm font-medium text-emerald-300">Training & Education</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Dedicated class and certification workspace.</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-200/60">
                This page is where learners request approval, start the class test, and continue into certification after admin approval from chegekeith4@gmail.com.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {certificationCourses.map((course) => {
                const {
                  learningConsultation,
                  approvedForClass,
                  testStatus,
                  certificationStarted,
                } = getCourseWorkflowState(course.title);

                return (
                  <div key={course.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1a33]/85 transition-all hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-[#102042]">
                    <div className="relative h-48 overflow-hidden">
                      <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a33] via-[#0b1a33]/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">Class</div>
                    </div>
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-white">{course.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-blue-200/60">{course.description}</p>
                      <p className="mt-5 text-xs uppercase tracking-[0.22em] text-emerald-200/70">{getTrackSessions(course.title).length} sessions in this track</p>
                      {approvedForClass && learningConsultation && learningConsultation.service !== course.title && (
                        <p className="mt-3 text-xs text-cyan-100/80">
                          Access enabled from approved certification request: <span className="font-semibold text-white">{learningConsultation.service}</span>
                        </p>
                      )}

                      <div className="mt-6 space-y-3">
                        {!approvedForClass ? (
                          <>
                            <button disabled className="w-full cursor-not-allowed rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/55">
                              Await admin approval
                            </button>
                            <p className="text-sm text-amber-200/85">
                              waiting for approval from admin
                            </p>
                          </>
                        ) : (courseTestStatus[course.id] || testStatus) !== 'completed' ? (
                          <button onClick={() => handleStartClassTest(course.id)} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
                            {(courseTestStatus[course.id] || testStatus) === 'in_progress' ? 'Test in progress...' : 'Start class test'}
                          </button>
                        ) : (
                          <button onClick={() => handleProceedCertification(course.id, course.title)} className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
                            Proceed to Certification Course Introduction
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const el = document.getElementById('contact');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-blue-100/80 hover:border-white/25 hover:text-white"
                        >
                          Ask About This Class
                        </button>
                        {(courseCertificationStarted[course.id] || certificationStarted) && <p className="text-xs text-green-200">Certification course introduction activated.</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <ConsultationForm />
        <Footer />
      </main>

      <ScrollToTop />
    </div>
  );
};

export default TrainingEducation;
