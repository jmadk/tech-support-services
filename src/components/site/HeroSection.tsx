import React, { useState, useEffect } from 'react';
import keithImage from '@/keith.jpg';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const [currentStat, setCurrentStat] = useState(0);
  const stats = [
    { value: '20+', label: 'Expert Services' },
    { value: '500+', label: 'Clients Served' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '10+', label: 'Years Experience' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [stats.length]);

  const scrollToServices = () => {
    const el = document.getElementById('services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_24%),radial-gradient(circle_at_82%_20%,_rgba(59,130,246,0.14),_transparent_18%),radial-gradient(circle_at_50%_100%,_rgba(125,211,252,0.22),_transparent_28%),linear-gradient(135deg,_#f8fcff_0%,_#eef7ff_42%,_#dceeff_100%)]" />
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: `
            linear-gradient(rgba(14,165,233,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,165,233,0.14) 1px, transparent 1px)
          `,
          backgroundSize: '88px 88px',
        }} />
        <div className="absolute inset-y-0 right-0 w-[48%] bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08)_0%,_rgba(220,238,255,0.12)_46%,_rgba(191,219,254,0.24)_100%)]" />
        <div className="absolute left-[12%] top-[18%] h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute right-[12%] top-[12%] h-72 w-72 rounded-full bg-blue-400/12 blur-3xl" />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500/35 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/75 border border-cyan-200 rounded-full mb-6 shadow-sm">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-cyan-700 text-sm font-medium">Trusted IT Solutions Provider</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Expert{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-500 bg-clip-text text-transparent">
                Tech
              </span>
              <br />
              Solutions & Training
            </h1>

            <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
              From system architecture to web development, database management to e-commerce solutions — we deliver comprehensive IT services that transform businesses and empower professionals.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={scrollToServices}
                className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 flex items-center gap-2"
              >
                Explore Services
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 border-2 border-slate-300 text-slate-800 font-bold rounded-xl bg-white/75 hover:bg-white hover:border-cyan-300 transition-all duration-300 flex items-center gap-2 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Get Started
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-all duration-500 ${
                    i === currentStat
                      ? 'bg-cyan-100/80 border-cyan-300 scale-105'
                      : 'bg-white/75 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - CEO Image */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-3xl blur-2xl" />
              <div className="relative">
                <div className="h-[20rem] w-[16rem] overflow-hidden rounded-3xl border-2 border-white/10 shadow-2xl xl:h-[22rem] xl:w-[17.5rem]">
                  <img
                    src={keithImage}
                    alt="Keith Chege Junior - CEO"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                {/* Floating card */}
                <div className="absolute -bottom-6 -left-8 bg-white/88 backdrop-blur-xl border border-cyan-100 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-sm">Keith Chege Junior</p>
                      <p className="text-cyan-700 text-xs">CEO & Lead Consultant</p>
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl p-3 shadow-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-slate-500 text-xs uppercase tracking-widest">Scroll</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </section>
  );
};

export default HeroSection;
