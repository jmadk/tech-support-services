import React from 'react';

interface CTABannerProps {
  onGetStarted: () => void;
}

const CTABanner: React.FC<CTABannerProps> = ({ onGetStarted }) => {
  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#1a237e] to-[#0d47a1]" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-20 w-64 h-64 border border-white/20 rounded-full" />
        <div className="absolute bottom-10 right-20 w-48 h-48 border border-white/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
          Ready to Elevate Your<br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">Technology Game?</span>
        </h2>
        <p className="text-blue-200/60 text-lg mb-10 max-w-2xl mx-auto">
          Join 500+ satisfied clients who trust KCJ Tech Solutions for their computer science needs. Let's build something amazing together.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={scrollToContact}
            className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all duration-300 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-1 flex items-center gap-2"
          >
            Book Free Consultation
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/10 hover:border-white/40 transition-all duration-300"
          >
            Create Account
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
