import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Discovery',
    description: 'We start by understanding your unique challenges, goals, and requirements through in-depth consultation.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    ),
  },
  {
    number: '02',
    title: 'Strategy',
    description: 'Our experts design a tailored solution architecture and implementation roadmap for your project.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    ),
  },
  {
    number: '03',
    title: 'Development',
    description: 'We build and implement your solution using cutting-edge technologies and industry best practices.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    ),
  },
  {
    number: '04',
    title: 'Delivery & Support',
    description: 'We deploy your solution and provide ongoing support, training, and optimization to ensure success.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
    ),
  },
];

const ProcessSection: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-4">
            <span className="text-cyan-600 text-sm font-medium">Our Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            How We <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Work</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            A proven methodology that ensures quality delivery and client satisfaction every time.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-cyan-200 to-blue-200 z-0" />
              )}

              <div className="relative z-10 text-center">
                {/* Number badge */}
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-xl group-hover:shadow-cyan-200 transition-all duration-500">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
