import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './site/Navbar';
import HeroSection from './site/HeroSection';
import TechStackBanner from './site/TechStackBanner';
import ServicesGrid from './site/ServicesGrid';
import WhyChooseUs from './site/WhyChooseUs';
import ProcessSection from './site/ProcessSection';
import Testimonials from './site/Testimonials';
import PricingSection from './site/PricingSection';
import CTABanner from './site/CTABanner';
import ConsultationForm from './site/ConsultationForm';
import Footer from './site/Footer';
import AuthModal from './site/AuthModal';
import ScrollToTop from './site/ScrollToTop';
import Dashboard from './site/Dashboard';

const AppLayout: React.FC = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const showDashboard = new URLSearchParams(location.search).get('view') === 'dashboard';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <p className="text-blue-200/50 text-sm">Loading KCJ Tech...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Navbar
        onAuthClick={() => setAuthOpen(true)}
        onDashboardClick={() => navigate('/?view=dashboard')}
        showDashboard={showDashboard}
        onHomeClick={() => navigate('/')}
      />

      {showDashboard ? (
        <Dashboard />
      ) : (
        <>
          <HeroSection onGetStarted={() => setAuthOpen(true)} />
          <TechStackBanner />
          <ServicesGrid />
          <WhyChooseUs />
          <ProcessSection />
          <Testimonials />
          <PricingSection />
          <CTABanner onGetStarted={() => setAuthOpen(true)} />
          <ConsultationForm />
          <Footer />
        </>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ScrollToTop />
    </div>
  );
};

export default AppLayout;
