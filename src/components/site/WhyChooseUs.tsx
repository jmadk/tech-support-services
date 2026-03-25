import React, { useState } from 'react';

const differentiators = [
  {
    title: 'Expert-Led Solutions',
    description: 'Every project is led by certified professionals with deep industry experience and academic expertise in computer science.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    ),
    stat: '20+',
    statLabel: 'Specializations',
  },
  {
    title: 'End-to-End Support',
    description: 'From initial consultation to deployment and maintenance, we provide comprehensive support throughout your entire project lifecycle.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
    stat: '24/7',
    statLabel: 'Availability',
  },
  {
    title: 'Cutting-Edge Technology',
    description: 'We stay ahead of the curve with the latest frameworks, tools, and methodologies to deliver modern, scalable solutions.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    ),
    stat: '100%',
    statLabel: 'Up-to-date',
  },
  {
    title: 'Proven Track Record',
    description: 'Hundreds of successful projects delivered across diverse industries, from startups to enterprise organizations.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    ),
    stat: '500+',
    statLabel: 'Projects Done',
  },
];

const WhyChooseUs: React.FC = () => {
  const [activeCard, setActiveCard] = useState(0);

  return (
    <section id="why-us" className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-cyan-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-50 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-3xl blur-2xl" />
            <img
              src="https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231285942_82fd0f97.png"
              alt="Professional workspace"
              className="relative rounded-3xl shadow-2xl w-full"
            />
            {/* Floating stats card */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900">98%</p>
                  <p className="text-sm text-gray-500">Client Satisfaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-4">
              <span className="text-cyan-600 text-sm font-medium">Why Choose Us</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              Trusted by <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Businesses</span> Worldwide
            </h2>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              We combine academic excellence with real-world expertise to deliver solutions that drive results. Here's what sets us apart.
            </p>

            {/* Cards */}
            <div className="space-y-4">
              {differentiators.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setActiveCard(i)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-500 ${
                    activeCard === i
                      ? 'border-cyan-500 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-lg shadow-cyan-100'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      activeCard === i
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                        <div className="text-right">
                          <span className={`text-xl font-extrabold ${activeCard === i ? 'text-cyan-600' : 'text-gray-300'}`}>{item.stat}</span>
                          <p className="text-xs text-gray-400">{item.statLabel}</p>
                        </div>
                      </div>
                      {activeCard === i && (
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed animate-in fade-in duration-300">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
