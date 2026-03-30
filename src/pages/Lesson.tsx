import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface LessonPhase {
  phase: 'loading' | 'narrator' | 'qa' | 'quiz' | 'complete';
}

type LessonData = {
  title: string;
  notes: string[];
  qaQuestions: Array<{ q: string; options: string[]; correct: number }>;
  quizQuestions: Array<{ q: string; options: string[]; correct: number }>;
};

type CurriculumSession = {
  label: string;
  title: string;
  focus: string;
  outcomes: string[];
  tools: string[];
};

const curriculumTracks: Record<string, CurriculumSession[]> = {
  'Database Systems': [
    {
      label: 'Introduction to Databases (1h)',
      title: 'Introduction to Databases',
      focus: 'core database concepts, DBMS roles, relational thinking, and data lifecycle foundations',
      outcomes: ['differentiate files from databases', 'identify DBMS responsibilities', 'describe relational vs NoSQL use cases'],
      tools: ['DBMS', 'tables', 'records', 'SQL'],
    },
    {
      label: 'Data Modeling & ERD (1h 30m)',
      title: 'Data Modeling & ERD',
      focus: 'entity analysis, relationships, normalization, and schema planning for diploma and degree projects',
      outcomes: ['build ER diagrams', 'identify entities and attributes', 'map cardinalities correctly'],
      tools: ['ERD', 'entities', 'attributes', 'normalization'],
    },
    {
      label: 'SQL Basics & Advanced Queries (1h 30m)',
      title: 'SQL Basics & Advanced Queries',
      focus: 'data retrieval, joins, grouping, subqueries, and query writing for academic and industry tasks',
      outcomes: ['write SELECT queries', 'use joins and grouping', 'interpret query results accurately'],
      tools: ['SELECT', 'JOIN', 'GROUP BY', 'subqueries'],
    },
    {
      label: 'Indexing & Optimization (1h)',
      title: 'Indexing & Optimization',
      focus: 'query performance, access paths, indexing tradeoffs, and execution planning',
      outcomes: ['explain index benefits', 'identify slow-query causes', 'choose useful indexes'],
      tools: ['indexes', 'query plans', 'search conditions', 'optimization'],
    },
    {
      label: 'Transactions & Concurrency (1h)',
      title: 'Transactions & Concurrency',
      focus: 'ACID, locking, isolation, rollback, and concurrent user safety',
      outcomes: ['define ACID properties', 'explain concurrency issues', 'identify transaction boundaries'],
      tools: ['transactions', 'locks', 'commit', 'rollback'],
    },
    {
      label: 'Backup & Recovery (1h)',
      title: 'Backup & Recovery',
      focus: 'business continuity, backup strategies, recovery objectives, and fault response',
      outcomes: ['compare backup types', 'plan recovery workflow', 'protect data availability'],
      tools: ['full backup', 'incremental backup', 'restore', 'recovery'],
    },
  ],
  'Data Communications & Networks': [
    {
      label: 'Networking Fundamentals (1h)',
      title: 'Networking Fundamentals',
      focus: 'network concepts, topology, addressing, and communication basics used across diploma and degree curricula',
      outcomes: ['define network components', 'explain topologies', 'describe network communication flow'],
      tools: ['hosts', 'switches', 'routers', 'media'],
    },
    {
      label: 'TCP/IP & OSI Models (1h 30m)',
      title: 'TCP/IP & OSI Models',
      focus: 'layered communication models and how protocols map to real network services',
      outcomes: ['name OSI layers', 'map protocols to layers', 'trace packet movement across layers'],
      tools: ['OSI', 'TCP/IP', 'encapsulation', 'protocol stack'],
    },
    {
      label: 'Routing & Switching (1h 30m)',
      title: 'Routing & Switching',
      focus: 'packet forwarding, MAC learning, subnetting, and network segmentation',
      outcomes: ['explain router vs switch roles', 'interpret forwarding decisions', 'apply subnetting basics'],
      tools: ['routing tables', 'MAC tables', 'subnets', 'VLANs'],
    },
    {
      label: 'Network Security (1h)',
      title: 'Network Security',
      focus: 'threats, controls, firewalls, authentication, and secure network design',
      outcomes: ['identify common threats', 'describe access controls', 'explain defense-in-depth'],
      tools: ['firewalls', 'ACLs', 'IDS/IPS', 'authentication'],
    },
    {
      label: 'Wireless & WAN Technologies (1h 30m)',
      title: 'Wireless & WAN Technologies',
      focus: 'wireless standards, WAN links, mobility, and enterprise connectivity choices',
      outcomes: ['compare WLAN and WAN uses', 'describe wireless challenges', 'identify enterprise connectivity options'],
      tools: ['Wi-Fi', 'WAN', 'latency', 'bandwidth'],
    },
  ],
  'Distributed Systems': [
    {
      label: 'Distributed System Concepts (1h)',
      title: 'Distributed System Concepts',
      focus: 'the structure, purpose, and tradeoffs of systems spread across multiple machines',
      outcomes: ['define distributed systems', 'describe benefits and risks', 'relate the model to cloud platforms'],
      tools: ['nodes', 'messages', 'coordination', 'scalability'],
    },
    {
      label: 'Consensus & Fault Tolerance (1h 30m)',
      title: 'Consensus & Fault Tolerance',
      focus: 'reliability, replication, leader election, and keeping services available under failure',
      outcomes: ['explain consensus goals', 'describe replication', 'identify fault-tolerance strategies'],
      tools: ['replication', 'consensus', 'failover', 'quorum'],
    },
    {
      label: 'Microservices Architecture (1h)',
      title: 'Microservices Architecture',
      focus: 'service decomposition, APIs, independent deployment, and boundaries in modern systems',
      outcomes: ['define microservices', 'compare with monoliths', 'identify service boundaries'],
      tools: ['services', 'APIs', 'deployment', 'service contracts'],
    },
    {
      label: 'Scalability & Load Balancing (1h 30m)',
      title: 'Scalability & Load Balancing',
      focus: 'horizontal scaling, bottlenecks, load balancing, and system growth patterns',
      outcomes: ['compare vertical and horizontal scaling', 'identify bottlenecks', 'explain load-balancing behavior'],
      tools: ['scaling', 'load balancer', 'throughput', 'availability'],
    },
  ],
};

function createLessonFromCurriculum(session: CurriculumSession): LessonData {
  return {
    title: session.title,
    notes: [
      `${session.title} covers ${session.focus}.`,
      `By the end of this lesson, you should be able to ${session.outcomes[0]}, ${session.outcomes[1]}, and ${session.outcomes[2]}.`,
      `This session is aligned with computer science degree and diploma expectations, where learners are expected to connect theory to lab work, coursework, and real deployments.`,
      `Key study terms in this session include ${session.tools.join(', ')}.`,
      `As you move through the lesson, focus on how the concepts support software development, infrastructure design, troubleshooting, and professional certification readiness.`,
    ],
    qaQuestions: [
      {
        q: `What is the primary focus of ${session.title}?`,
        options: [
          session.focus,
          'Only memorizing terms without application',
          'Avoiding practical work completely',
          'Replacing every other module in the curriculum',
        ],
        correct: 0,
      },
      {
        q: `Which outcome is expected from ${session.title}?`,
        options: [
          'Ignoring implementation details',
          session.outcomes[1],
          'Skipping assessment tasks',
          'Removing the need for foundational knowledge',
        ],
        correct: 1,
      },
    ],
    quizQuestions: [
      {
        q: `Which set contains concepts central to ${session.title}?`,
        options: [
          session.tools.join(', '),
          'Payroll, accounting, and taxation only',
          'Graphic design and illustration only',
          'Unrelated office stationery terms',
        ],
        correct: 0,
      },
      {
        q: 'Why is this session included in the curriculum?',
        options: [
          'To build academic and practical competency in the track',
          'To delay progress without learning value',
          'To remove the need for future modules',
          'To avoid assessment and review',
        ],
        correct: 0,
      },
      {
        q: 'What is the best approach while studying this lesson?',
        options: [
          'Connect each concept to labs, projects, and real support scenarios',
          'Read only the title and leave',
          'Skip all questions and feedback',
          'Treat all topics as unrelated facts',
        ],
        correct: 0,
      },
    ],
  };
}

const lessonContent: Record<string, Record<string, LessonData>> = Object.fromEntries(
  Object.entries(curriculumTracks).map(([course, sessions]) => [
    course,
    Object.fromEntries(sessions.map((session) => [session.label, createLessonFromCurriculum(session)])),
  ]),
);

function buildFallbackLesson(course: string, session: string): LessonData {
  const sessionTitle = session.replace(/\s*\([^)]*\)\s*$/, '').trim() || 'Lesson Session';
  const courseTitle = course || 'Certification Track';

  return {
    title: sessionTitle,
    notes: [
      `Welcome to ${sessionTitle} in the ${courseTitle} track.`,
      `This lesson focuses on the main ideas, vocabulary, and practical workflow used in ${courseTitle}.`,
      `Pay attention to the core concepts introduced in ${sessionTitle}, because they will support later sessions and certification tasks.`,
      `As you proceed, connect each concept to a real project or support scenario so the lesson becomes practical and memorable.`,
      `Use the Q&A and quiz sections to confirm understanding before moving to the next milestone.`,
    ],
    qaQuestions: [
      {
        q: `What is the main goal of the ${sessionTitle} session?`,
        options: [
          'To build understanding of the session fundamentals',
          'To skip directly to certification',
          'To avoid practical examples',
          'To replace all previous lessons',
        ],
        correct: 0,
      },
      {
        q: 'What is the best way to benefit from this lesson?',
        options: [
          'Ignore the examples',
          'Relate the concepts to real tasks and workflows',
          'Memorize only the title',
          'Skip the questions',
        ],
        correct: 1,
      },
    ],
    quizQuestions: [
      {
        q: `Which statement best describes ${sessionTitle}?`,
        options: [
          'It introduces concepts you can apply in practice',
          'It has no connection to the certification path',
          'It is only for entertainment',
          'It replaces every other session',
        ],
        correct: 0,
      },
      {
        q: 'What should you do before moving to the next session?',
        options: [
          'Close the lesson immediately',
          'Confirm understanding through Q&A and quiz review',
          'Delete your progress',
          'Skip the dashboard entirely',
        ],
        correct: 1,
      },
      {
        q: 'Why are lesson activities included in the flow?',
        options: [
          'To help reinforce learning and readiness',
          'To make the page longer',
          'To prevent progress permanently',
          'To remove the need for practice',
        ],
        correct: 0,
      },
    ],
  };
}

function resolveLessonData(course: string, session: string): LessonData | null {
  if (!course || !session) {
    return null;
  }

  const exactCourse = lessonContent[course];
  if (exactCourse?.[session]) {
    return exactCourse[session];
  }

  return buildFallbackLesson(course, session);
}

const Lesson: React.FC = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'narrator' | 'qa' | 'quiz' | 'complete'>('narrator');
  const [qaAnswers, setQaAnswers] = useState<Record<number, number>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [narrating, setNarrating] = useState(true);

  // Parse from sessionStorage (passed from Dashboard or ServicesGrid)
  let storageKey = '';

  if (consultationId) {
    if (consultationId.startsWith('service-')) {
      const serviceId = consultationId.split('service-')[1];
      storageKey = `lesson_service_${serviceId}`;
    } else {
      storageKey = `lesson_${consultationId}`;
    }
  }

  const sessionData = storageKey ? sessionStorage.getItem(storageKey) : null;
  const searchParams = new URLSearchParams(location.search);
  const queryCourse = searchParams.get('course') || '';
  const querySession = searchParams.get('session') || '';
  const payload = sessionData ? JSON.parse(sessionData) : { course: queryCourse, session: querySession };
  const course = payload.course || queryCourse;
  const session = payload.session || querySession;

  const courseData = resolveLessonData(course, session);
  const sessionLabels = curriculumTracks[course]?.map((item) => item.label) || [];
  const currentSessionIndex = sessionLabels.indexOf(session);
  const nextSessionLabel = currentSessionIndex >= 0 ? sessionLabels[currentSessionIndex + 1] || '' : '';

  useEffect(() => {
    if (storageKey && course && session) {
      sessionStorage.setItem(storageKey, JSON.stringify({ course, session }));
    }
  }, [storageKey, course, session]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !courseData) {
      navigate('/');
      return;
    }
    setPhase((current) => (current === 'loading' ? 'narrator' : current));
  }, [user, courseData, loading, navigate]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNarratorComplete = () => {
    setNarrating(false);
    setTimeout(() => setPhase('qa'), 1000);
  };

  const handleQASubmit = () => {
    setPhase('quiz');
  };

  const handleQuizSubmit = () => {
    setPhase('complete');
  };

  const handleNextSession = () => {
    if (!consultationId || !nextSessionLabel) {
      navigate('/dashboard');
      return;
    }

    const nextPayload = { course, session: nextSessionLabel };
    sessionStorage.setItem(`lesson_${consultationId}`, JSON.stringify(nextPayload));
    setQaAnswers({});
    setQuizAnswers({});
    setNarrating(true);
    setPhase('narrator');
    navigate(`/lesson/${consultationId}?course=${encodeURIComponent(course)}&session=${encodeURIComponent(nextSessionLabel)}`);
  };

  if (!courseData) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Loading lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#0f1f35] pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-cyan-400 hover:text-cyan-300 text-sm mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">{courseData.title}</h1>
          <p className="text-gray-400">{session}</p>
        </div>

        {/* NARRATOR PHASE */}
        {(phase === 'loading' || phase === 'narrator') && (
          <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5h4V7h2v5h4l-5 5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">🎙️ AI Narrator</h2>
                <p className="text-gray-300 text-sm">Your lesson is being narrated. Listen carefully.</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {courseData.notes.map((note, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${
                    narrating
                      ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-100'
                      : 'bg-white/5 border-white/10 text-gray-300'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{note}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => speakText(courseData.notes.join(' '))}
                className="flex-1 px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-medium hover:bg-cyan-500/30 transition-all"
              >
                🔊 Re-play Narrator
              </button>
              <button
                onClick={handleNarratorComplete}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-all"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Q&A PHASE */}
        {phase === 'qa' && (
          <div className="bg-white/5 border border-violet-500/30 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">❓ Session Q&A</h2>
            <div className="space-y-6 mb-8">
              {courseData.qaQuestions.map((q, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white font-medium mb-4">{idx + 1}. {q.q}</p>
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`qa-${idx}`}
                          value={optIdx}
                          checked={qaAnswers[idx] === optIdx}
                          onChange={() => setQaAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleQASubmit}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:opacity-90 transition-all"
            >
              Proceed to Certification Quiz →
            </button>
          </div>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && (
          <div className="bg-white/5 border border-green-500/30 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">🏆 Certification Quiz</h2>
            <p className="text-gray-400 mb-6">Answer these questions to earn your certification.</p>
            <div className="space-y-6 mb-8">
              {courseData.quizQuestions.map((q, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white font-medium mb-4">{idx + 1}. {q.q}</p>
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`quiz-${idx}`}
                          value={optIdx}
                          checked={quizAnswers[idx] === optIdx}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(quizAnswers).length < courseData.quizQuestions.length}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all disabled:cursor-not-allowed"
            >
              Submit Certification Quiz
            </button>
          </div>
        )}

        {/* COMPLETION PHASE */}
        {phase === 'complete' && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-green-300 mb-3">🎓 Certification Complete!</h2>
            <p className="text-green-200 mb-2">Congratulations! You've successfully completed the {session} session.</p>
            <p className="text-green-100/70 mb-8">Your certification has been recorded and you can now advance to the next session in the {course} curriculum.</p>
            
            <div className={`grid gap-4 ${nextSessionLabel ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
              >
                Home
              </button>
              {nextSessionLabel && (
                <button
                  onClick={handleNextSession}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-all"
                >
                  Next Session
                </button>
              )}
              <button
                onClick={() => {
                  sessionStorage.removeItem(`lesson_${consultationId}`);
                  navigate('/dashboard');
                }}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lesson;
