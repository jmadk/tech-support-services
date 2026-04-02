import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { IT_SUPPORT_CUSTOMER_CARE_COURSE, IT_SUPPORT_CUSTOMER_CARE_TRACK } from '@/lib/it-support-course';

const serviceCategories = [
  { id: 'all', label: 'All Services' },
  { id: 'engineering', label: 'Software Engineering' },
  { id: 'systems', label: 'Systems & Infrastructure' },
  { id: 'data', label: 'Data & AI' },
  { id: 'advisory', label: 'Advisory & Research' },
];

const expertServices = [
  { id: 1, category: 'engineering', badge: 'Build', title: 'Custom Software Development', description: 'Build web apps, portals, admin tools, and workflow systems tailored to business or institutional operations.', deliverables: ['web apps', 'portals', 'dashboards'], image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80' },
  { id: 2, category: 'engineering', badge: 'Web', title: 'Website & E-Commerce Solutions', description: 'Create business websites, online stores, payment flows, and polished digital experiences that convert visitors into clients.', deliverables: ['websites', 'stores', 'payments'], image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1080&q=80' },
  { id: 3, category: 'engineering', badge: 'API', title: 'Backend & API Engineering', description: 'Design secure APIs, backend services, authentication flows, and platform integrations for modern software systems.', deliverables: ['APIs', 'auth', 'integrations'], image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1080&q=80' },
  { id: 4, category: 'systems', badge: 'Support', title: 'IT Support & Troubleshooting', description: 'Resolve software incidents, device issues, connectivity failures, and recurring operational bottlenecks for users and teams.', deliverables: ['helpdesk', 'diagnosis', 'remote support'], image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1080&q=80' },
  { id: 5, category: 'systems', badge: 'Admin', title: 'Systems Setup & Administration', description: 'Install, configure, secure, and maintain operating systems, servers, accounts, and shared office environments.', deliverables: ['deployment', 'accounts', 'servers'], image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1080&q=80' },
  { id: 6, category: 'systems', badge: 'Network', title: 'Network Design & Support', description: 'Plan, configure, and troubleshoot LAN, Wi-Fi, switching, routing, and office network infrastructure.', deliverables: ['LAN', 'Wi-Fi', 'routing'], image: 'https://images.unsplash.com/photo-1563770660941-10a63607601d?auto=format&fit=crop&w=1080&q=80' },
  { id: 7, category: 'data', badge: 'Data', title: 'Database Design & Optimization', description: 'Model data, improve SQL performance, refine schema quality, and support reliable reporting systems.', deliverables: ['schema', 'SQL', 'reports'], image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1080&q=80' },
  { id: 8, category: 'data', badge: 'Insights', title: 'Data Analysis & Dashboards', description: 'Transform raw business or academic data into clean reports, dashboards, and actionable decision support.', deliverables: ['analysis', 'dashboards', 'reports'], image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1080&q=80' },
  { id: 9, category: 'data', badge: 'AI', title: 'AI Workflow Integration', description: 'Integrate practical AI assistants, content tools, and automation workflows into existing teams and systems.', deliverables: ['assistants', 'automation', 'workflows'], image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1080&q=80' },
  { id: 10, category: 'advisory', badge: 'Consult', title: 'System Analysis & Technical Consulting', description: 'Clarify requirements, audit problem areas, recommend architectures, and guide implementation decisions.', deliverables: ['audits', 'requirements', 'roadmaps'], image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80' },
  { id: 11, category: 'advisory', badge: 'Review', title: 'Code Review & Project Rescue', description: 'Review codebases, identify delivery risks, fix blockers, and stabilize software projects that need expert intervention.', deliverables: ['reviews', 'bug triage', 'stabilization'], image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1080&q=80' },
  { id: 12, category: 'advisory', badge: 'Docs', title: 'Research, Documentation & Technical Writing', description: 'Support reports, proposals, documentation systems, and polished technical communication for teams and students.', deliverables: ['reports', 'docs', 'research'], image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1080&q=80' },
];

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

const ServicesGrid: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedService, setExpandedService] = useState<number | null>(null);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<number | null>(null);
  const [courseTestStatus, setCourseTestStatus] = useState<Record<number, 'not_started' | 'in_progress' | 'completed'>>({});
  const [courseCertificationStarted, setCourseCertificationStarted] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!user) {
      setSavedTitles(new Set());
      return;
    }
    const loadSaved = async () => {
      const { savedServices } = await api.getSavedServices();
      setSavedTitles(new Set(savedServices.map((item) => item.service_title)));
    };
    loadSaved();
  }, [user]);

  const filteredServices = useMemo(() => expertServices.filter((service) => {
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || service.title.toLowerCase().includes(q) || service.description.toLowerCase().includes(q) || service.deliverables.some((item) => item.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  }), [activeCategory, searchQuery]);

  const toggleSave = async (event: React.MouseEvent, service: typeof expertServices[number]) => {
    event.stopPropagation();
    if (!user) return;
    setSavingId(service.id);
    if (savedTitles.has(service.title)) {
      const { savedServices } = await api.getSavedServices();
      const existing = savedServices.find((item) => item.service_title === service.title);
      if (existing) await api.deleteSavedService(existing.id);
      setSavedTitles((prev) => {
        const next = new Set(prev);
        next.delete(service.title);
        return next;
      });
    } else {
      await api.saveService({
        service_title: service.title,
        service_category: service.category,
        service_description: service.description,
      });
      setSavedTitles((prev) => new Set(prev).add(service.title));
    }
    setSavingId(null);
  };

  const getTrackSessions = (courseTitle: string) => certificationCatalog[courseTitle]?.sessions || buildGenericTrackSessions(courseTitle);

  const handleStartClassTest = (courseId: number) => {
    setCourseTestStatus((prev) => ({ ...prev, [courseId]: 'in_progress' }));
    setTimeout(() => {
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
    <section id="services" className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0f1d35] to-[#0a1628] py-24">
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
            <span className="text-sm font-medium text-cyan-300">Services, Classes & Certification</span>
          </div>
          <h2 className="mb-4 text-4xl font-extrabold text-white sm:text-5xl">
            Choose Between <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Expert Service</span> and <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">Learning Path</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-blue-200/60">
            Direct service requests now stand on their own, while class and certification remain in a separate area below.
          </p>
        </div>

        <div className="mb-24">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Expert Services</p>
              <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">Professional computer science services.</h3>
              <p className="mt-3 text-base leading-7 text-blue-200/60">These are practical services a computer science expert typically offers to organizations, founders, teams, and institutions.</p>
            </div>

            <div className="w-full max-w-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expert services..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white outline-none transition-all placeholder:text-blue-300/40 focus:border-cyan-500/50 focus:bg-white/10"
              />
            </div>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {serviceCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' : 'border border-white/10 bg-white/5 text-blue-200/60 hover:bg-white/10 hover:text-white'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <p className="mb-6 text-center text-sm text-blue-300/40">Showing {filteredServices.length} of {expertServices.length} expert services</p>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-white/10 hover:shadow-xl hover:shadow-cyan-500/10 ${expandedService === service.id ? 'ring-2 ring-cyan-500/50 bg-white/10' : ''}`}
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={service.image} alt={service.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/45 to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-cyan-500/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">{service.badge}</div>
                  {user && (
                    <button
                      onClick={(event) => toggleSave(event, service)}
                      disabled={savingId === service.id}
                      className={`absolute right-3 top-3 rounded-xl px-3 py-2 text-xs font-bold transition-all ${savedTitles.has(service.title) ? 'bg-cyan-500 text-white' : 'bg-black/35 text-white/75 backdrop-blur-sm hover:bg-black/50 hover:text-white'}`}
                    >
                      {savedTitles.has(service.title) ? 'Saved' : 'Save'}
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <h4 className="text-lg font-bold text-white transition-colors group-hover:text-cyan-300">{service.title}</h4>
                  <p className={`mt-2 text-sm leading-relaxed text-blue-200/55 ${expandedService === service.id ? '' : 'line-clamp-3'}`}>{service.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {service.deliverables.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-100/80">{item}</span>
                    ))}
                  </div>
                  {expandedService === service.id && (
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          const el = document.getElementById('contact');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:from-cyan-400 hover:to-blue-500"
                      >
                        Request Service
                      </button>
                      {user && (
                        <button
                          onClick={(event) => toggleSave(event, service)}
                          className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${savedTitles.has(service.title) ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-blue-200/70 hover:border-white/30 hover:text-white'}`}
                        >
                          {savedTitles.has(service.title) ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Classes & Certification</p>
              <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">Learning stays separate here.</h3>
              <p className="mt-3 text-base leading-7 text-blue-200/60">The training path is still available, but it now lives in its own dedicated area instead of being mixed into service cards.</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">Start the class test, then continue to certification.</div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {certificationCourses.map((course) => (
              <div key={course.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1a33]/85 transition-all hover:border-emerald-400/30 hover:bg-[#102042]">
                <div className="relative h-40 overflow-hidden">
                  <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a33] via-[#0b1a33]/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">Class</div>
                </div>
                <div className="p-5">
                  <h4 className="text-lg font-bold text-white">{course.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-blue-200/60">{course.description}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.22em] text-emerald-200/70">{getTrackSessions(course.title).length} sessions in this track</p>
                  <div className="mt-5 space-y-2">
                    {courseTestStatus[course.id] !== 'completed' ? (
                      <button onClick={() => handleStartClassTest(course.id)} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                        {courseTestStatus[course.id] === 'in_progress' ? 'Test in progress...' : 'Start class test'}
                      </button>
                    ) : (
                      <button onClick={() => handleProceedCertification(course.id, course.title)} className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                        Proceed to Certification Course Introduction
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const el = document.getElementById('contact');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-blue-100/80 hover:border-white/25 hover:text-white"
                    >
                      Ask About This Class
                    </button>
                    {courseCertificationStarted[course.id] && <p className="text-xs text-green-200">Certification course introduction activated.</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;
