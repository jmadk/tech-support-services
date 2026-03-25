import React, { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: 'KES 5,000',
    period: '/session',
    description: 'Perfect for individuals seeking one-on-one consultation or training.',
    features: [
      'Single service consultation',
      '2-hour session',
      'Email support for 7 days',
      'Session recording',
      'Basic documentation',
    ],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    name: 'Professional',
    price: 'KES 25,000',
    period: '/month',
    description: 'Ideal for businesses needing ongoing IT support and development.',
    features: [
      'Up to 5 service areas',
      'Unlimited consultations',
      '24/7 priority support',
      'Custom project development',
      'Weekly progress reports',
      'Dedicated account manager',
      'Code review & audit',
    ],
    highlighted: true,
    cta: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Comprehensive solutions for large organizations and institutions.',
    features: [
      'All 20+ service areas',
      'On-site team deployment',
      'Custom training programs',
      'Infrastructure setup',
      'SLA guarantee',
      'Quarterly strategy reviews',
      'White-label solutions',
      'Priority feature requests',
    ],
    highlighted: false,
    cta: 'Contact Us',
  },
];

const PricingSection: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelect = (planName: string) => {
    setSelectedPlan(planName);
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-4">
            <span className="text-cyan-600 text-sm font-medium">Pricing Plans</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Simple, <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Transparent</span> Pricing
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Choose the plan that fits your needs. All plans include access to our expert team and industry-leading solutions.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 transition-all duration-500 ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-[#0a1628] to-[#1a237e] text-white shadow-2xl shadow-blue-900/30 scale-105 border-2 border-cyan-500/30'
                  : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-xl'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-blue-200/60' : 'text-gray-500'}`}>
                {plan.description}
              </p>

              <div className="mb-8">
                <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ml-1 ${plan.highlighted ? 'text-blue-200/60' : 'text-gray-400'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.highlighted ? 'bg-cyan-500/20' : 'bg-cyan-50'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={plan.highlighted ? '#22d3ee' : '#06b6d4'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span className={`text-sm ${plan.highlighted ? 'text-blue-100/80' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.name)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/30'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
