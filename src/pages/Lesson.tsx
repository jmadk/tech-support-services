import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface LessonPhase {
  phase: 'loading' | 'narrator' | 'qa' | 'quiz' | 'complete';
}

const lessonContent: Record<string, Record<string, {
  title: string;
  notes: string[];
  qaQuestions: Array<{ q: string; options: string[]; correct: number }>;
  quizQuestions: Array<{ q: string; options: string[]; correct: number }>;
}>> = {
  'Database Systems': {
    'Introduction to Databases (1h)': {
      title: 'Introduction to Databases',
      notes: [
        'A database is an organized collection of structured data.',
        'Databases use DBMS software to manage, store, and retrieve information.',
        'There are two main types: Relational and NoSQL databases.',
        'Relational databases organize data in tables with rows and columns.',
        'SQL is the standard language for querying relational databases.',
        'Databases ensure data integrity, security, and efficient retrieval.',
      ],
      qaQuestions: [
        {
          q: 'What is a primary key in a database table?',
          options: [
            'A unique identifier for each row in a table',
            'The first column in a table',
            'A column that can contain NULL values',
            'A backup key for security'
          ],
          correct: 0
        },
        {
          q: 'Which of these is a characteristic of relational databases?',
          options: [
            'Data stored in JSON format',
            'Data stored in tables with defined schemas',
            'No relationships between tables',
            'Only supports unstructured data'
          ],
          correct: 1
        }
      ],
      quizQuestions: [
        {
          q: 'What does ACID stand for in database transactions?',
          options: [
            'Atomicity, Consistency, Isolation, Durability',
            'Access, Control, Integration, Data',
            'Application, Configuration, Implementation, Deployment',
            'Analysis, Coding, Implementation, Debugging'
          ],
          correct: 0
        },
        {
          q: 'Which of these is NOT a basic SQL operation?',
          options: [
            'SELECT',
            'INSERT',
            'EXECUTE',
            'DELETE'
          ],
          correct: 2
        },
        {
          q: 'What is normalization in database design?',
          options: [
            'The process of organizing data to reduce redundancy',
            'Converting text to numbers',
            'Making all tables the same size',
            'Backing up database files'
          ],
          correct: 0
        }
      ]
    },
  },
  'Data Communications & Networks': {
    'Networking Fundamentals (1h)': {
      title: 'Networking Fundamentals',
      notes: [
        'A computer network is a collection of interconnected devices.',
        'Networks enable communication and resource sharing between computers.',
        'The OSI model has 7 layers that structure network communication.',
        'TCP/IP is the primary protocol suite used on the internet.',
        'IP addresses uniquely identify devices on a network.',
        'Network protocols define rules for data transmission and reception.',
      ],
      qaQuestions: [
        {
          q: 'What is an IP address?',
          options: [
            'A unique numerical identifier for a device on a network',
            'A type of internet service provider',
            'A security password for networks',
            'The speed of internet connection'
          ],
          correct: 0
        },
        {
          q: 'How many layers are in the OSI model?',
          options: [
            '5 layers',
            '6 layers',
            '7 layers',
            '10 layers'
          ],
          correct: 2
        }
      ],
      quizQuestions: [
        {
          q: 'What is the purpose of DNS?',
          options: [
            'To convert domain names to IP addresses',
            'To encrypt network traffic',
            'To manage network bandwidth',
            'To filter spam emails'
          ],
          correct: 0
        },
        {
          q: 'Which layer of the OSI model handles physical transmission?',
          options: [
            'Application Layer',
            'Transport Layer',
            'Network Layer',
            'Physical Layer'
          ],
          correct: 3
        },
        {
          q: 'What does TCP ensure in data transmission?',
          options: [
            'Fast delivery',
            'Reliable, ordered delivery with error checking',
            'Encrypted communication',
            'Broadcast to all devices'
          ],
          correct: 1
        }
      ]
    },
  },
  'Distributed Systems': {
    'Distributed System Concepts (1h)': {
      title: 'Distributed System Concepts',
      notes: [
        'A distributed system consists of multiple computers working together.',
        'These systems share a common goal and communicate over a network.',
        'Key benefits include scalability, reliability, and resource sharing.',
        'Challenges include network latency, consistency, and fault tolerance.',
        'Cloud computing is built on distributed system principles.',
        'Load balancing distributes work across multiple servers.',
      ],
      qaQuestions: [
        {
          q: 'What is the main advantage of distributed systems?',
          options: [
            'All data stored in one place',
            'Scalability and fault tolerance',
            'Lower network usage',
            'Simpler programming'
          ],
          correct: 1
        },
        {
          q: 'What is load balancing?',
          options: [
            'Reducing the weight of data',
            'Distributing network traffic across multiple servers',
            'Balancing electricity between devices',
            'Organizing files in alphabetical order'
          ],
          correct: 1
        }
      ],
      quizQuestions: [
        {
          q: 'Which is a key challenge in distributed systems?',
          options: [
            'Too much data storage',
            'Network latency and consistency',
            'Using too many programming languages',
            'Expensive hardware'
          ],
          correct: 1
        },
        {
          q: 'What does CAP theorem state?',
          options: [
            'All systems must be cheap',
            'A distributed system can guarantee at most 2 of: Consistency, Availability, Partition tolerance',
            'Computers must be of equal capacity',
            'Data must be replicated 3 times'
          ],
          correct: 1
        },
        {
          q: 'What is a microservice?',
          options: [
            'A small amount of data',
            'An independent, loosely coupled service that does one thing well',
            'A tiny computer',
            'A fast network protocol'
          ],
          correct: 1
        }
      ]
    },
  },
};

const Lesson: React.FC = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'narrator' | 'qa' | 'quiz' | 'complete'>('loading');
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
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

  const courseData = lessonContent[course]?.[session];

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

    // Start narrator phase after 1 second
    const timer = setTimeout(() => setPhase('narrator'), 1000);
    return () => clearTimeout(timer);
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
        {phase === 'narrator' && (
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
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
              >
                Home
              </button>
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
