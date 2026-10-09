import React, { useState, useEffect } from 'react';
import keithImage from '@/keith.jpg';

const heroBackgrounds = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80',
];

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const [currentStat, setCurrentStat] = useState(0);
  const [currentBackground, setCurrentBackground] = useState(0);
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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = window.setInterval(() => {
      setCurrentBackground((current) => (current + 1) % heroBackgrounds.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  const scrollToServices = () => {
    const el = document.getElementById('services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden bg-[#071426]">
        {heroBackgrounds.map((image, index) => (
          <div
            key={image}
            aria-hidden="true"
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ${index === currentBackground ? 'hero-background-drift opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url("${image}")` }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(4,14,30,0.88)_0%,rgba(5,24,48,0.72)_48%,rgba(6,28,52,0.68)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(37,99,235,0.20),transparent_36%)]" />
        <div className="absolute inset-0 opacity-[0.10]" style={{
          backgroundImage: `
            linear-gradient(rgba(103,232,249,0.20) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103,232,249,0.16) 1px, transparent 1px)
          `,
          backgroundSize: '88px 88px',
        }} />
        <div className="absolute -left-24 top-[18%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[10%] bottom-[8%] h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
      </div>
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-200/65 rounded-full animate-pulse"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950/40 border border-cyan-200/25 backdrop-blur-md rounded-full mb-6 shadow-lg shadow-black/10">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-cyan-100 text-sm font-medium">Trusted IT Solutions Provider</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Expert{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-sky-200 bg-clip-text text-transparent">
                Tech
              </span>
              <br />
              Solutions & Training
            </h1>

            <p className="text-lg text-blue-50/80 mb-8 max-w-xl leading-relaxed">
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
                className="px-8 py-4 border border-white/30 text-white font-bold rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-cyan-200/70 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-black/10"
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
                      ? 'bg-cyan-400/20 border-cyan-200/60 scale-105 shadow-lg shadow-cyan-950/25'
                      : 'bg-slate-950/35 border-white/15 shadow-sm shadow-black/10'
                  }`}
                >
                  <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs text-blue-100/65 mt-0.5">{stat.label}</div>
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
        <span className="text-blue-100/60 text-xs uppercase tracking-widest">Scroll</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-100/60"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </section>
  );
};

export default HeroSection;
