import React from 'react';

const technologies = [
  'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB',
  'AWS', 'Docker', 'Linux', 'C++', 'TypeScript', 'PHP', 'HTML/CSS',
  'Git', 'REST APIs', 'GraphQL', 'Kubernetes', 'TensorFlow', 'Firebase',
];

const TechStackBanner: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-[#0a1628] via-[#0d1b36] to-[#0a1628] relative overflow-hidden border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-xl font-bold text-white mb-2">Technologies We Master</h3>
          <p className="text-blue-200/40 text-sm">Proficient across the full technology stack</p>
        </div>

        {/* Scrolling row 1 */}
        <div className="relative overflow-hidden mb-4">
          <div className="flex gap-4 animate-marquee">
            {[...technologies, ...technologies].map((tech, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-blue-200/60 text-sm font-medium hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all cursor-default"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>

        {/* Scrolling row 2 (reverse) */}
        <div className="relative overflow-hidden">
          <div className="flex gap-4 animate-marquee-reverse">
            {[...technologies.slice().reverse(), ...technologies.slice().reverse()].map((tech, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-blue-200/60 text-sm font-medium hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all cursor-default"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 35s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default TechStackBanner;
