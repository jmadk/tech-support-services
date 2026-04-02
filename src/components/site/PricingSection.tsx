import React, { useState } from 'react';
import { COMPLEXITY_OPTIONS, formatKes, getServicePricingSummary } from '@/lib/service-pricing';

const spotlightServices = [
  {
    title: 'Software Development',
    description: 'Custom engineering for web, desktop, backend systems, APIs, testing, debugging, and long-term upgrades.',
  },
  {
    title: 'Web & App Development',
    description: 'Client websites, e-commerce builds, mobile apps, platform redesigns, and product-ready user flows.',
  },
  {
    title: 'Artificial Intelligence & Machine Learning',
    description: 'Predictive models, chatbots, NLP systems, computer vision, recommendation engines, and AI strategy.',
  },
];

const paymentOptions = [
  {
    title: 'M-Pesa First',
    description: 'Primary checkout path uses Safaricom Daraja STK Push so clients can authorize payment from their phone.',
  },
  {
    title: 'Manual M-Pesa',
    description: 'Fallback option lets clients send directly to 0757152440 and then share their M-Pesa confirmation message.',
  },
  {
    title: 'Card Option',
    description: 'Debit and credit card checkout stays visible as an alternative for clients who cannot pay by M-Pesa.',
  },
  {
    title: 'Bank Option',
    description: 'Bank transfer appears in the payment choices, but it stays inactive until account details are added.',
  },
];

const PricingSection: React.FC = () => {
  const [selectedService, setSelectedService] = useState(spotlightServices[0].title);
  const pricing = getServicePricingSummary(selectedService);

  const handleOpenContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 opacity-20" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2">
            <span className="text-sm font-medium text-cyan-600">Service Payments</span>
          </div>
          <h2 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Complexity-Based <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Payment Plan</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-500">
            Pricing is shaped by the service requested and the delivery complexity. M-Pesa STK Push leads the checkout flow, manual M-Pesa is available as a fallback, and card or bank options remain visible for broader client coverage.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-cyan-100/30">
            <div className="mb-8 flex flex-wrap gap-3">
              {spotlightServices.map((service) => (
                <button
                  key={service.title}
                  onClick={() => setSelectedService(service.title)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    selectedService === service.title
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-cyan-300 hover:text-cyan-700'
                  }`}
                >
                  {service.title}
                </button>
              ))}
            </div>

            <div className="mb-10 rounded-3xl bg-gradient-to-br from-[#081426] via-[#102446] to-[#143766] p-8 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Pricing Focus</p>
              <h3 className="mt-3 text-3xl font-black">{selectedService}</h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100/70">
                {spotlightServices.find((service) => service.title === selectedService)?.description}
              </p>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {COMPLEXITY_OPTIONS.map((option) => {
                  const amount = pricing[option.id];
                  return (
                    <div key={option.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">{option.label}</p>
                      <div className="mt-4">
                        <span className="text-3xl font-extrabold">{formatKes(amount)}</span>
                        <span className="ml-1 text-sm text-blue-200/60">{option.period}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-blue-100/65">{option.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {paymentOptions.map((option) => (
                <div key={option.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">{option.title}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#12315e] bg-gradient-to-b from-[#0a1628] to-[#14284b] p-8 text-white shadow-2xl shadow-blue-900/20">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-300">Checkout Notes</p>
            <h3 className="mt-4 text-3xl font-black">How payments now flow</h3>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-sm font-semibold text-cyan-200">1. Select a service request</p>
                <p className="mt-2 text-sm leading-6 text-blue-100/70">Choose the exact service, then set the scope to starter, professional, or enterprise based on the work involved.</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-sm font-semibold text-cyan-200">2. Choose a payment rail</p>
                <p className="mt-2 text-sm leading-6 text-blue-100/70">M-Pesa STK Push is the main route. Manual M-Pesa to 0757152440 is the direct fallback when automated checkout is not available.</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-sm font-semibold text-cyan-200">3. Confirm payment evidence</p>
                <p className="mt-2 text-sm leading-6 text-blue-100/70">Manual M-Pesa payments should be followed by the client sharing the transaction message so you can verify and continue delivery.</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-sm font-semibold text-cyan-200">4. Start delivery after confirmation</p>
                <p className="mt-2 text-sm leading-6 text-blue-100/70">Once payment is initiated and your request is reviewed, the project proceeds according to the selected complexity tier.</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">M-Pesa Contact</p>
              <p className="mt-3 text-2xl font-black">0757 152 440</p>
              <p className="mt-2 text-sm leading-6 text-blue-100/65">
                The public payment contact is shown here for trust and fallback support, while live STK Push uses the Daraja business credentials configured on the server.
              </p>
            </div>

            <button
              onClick={handleOpenContact}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-300 hover:to-blue-400"
            >
              Open Service Payment Form
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
