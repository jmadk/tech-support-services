import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import ScrollToTop from '@/components/site/ScrollToTop';
import { findServiceBySlug } from '@/lib/service-catalog';

const ServiceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { slug = '' } = useParams();
  const service = findServiceBySlug(slug);

  if (!service) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-white">
        <Navbar onAuthClick={() => {}} onDashboardClick={() => navigate('/?view=dashboard')} showDashboard={false} onHomeClick={() => navigate('/')} />
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Service Not Found</p>
          <h1 className="mt-4 text-4xl font-black">That service page does not exist.</h1>
          <button
            onClick={() => navigate('/#services')}
            className="mt-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white"
          >
            Back to Services
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <Navbar onAuthClick={() => {}} onDashboardClick={() => navigate('/?view=dashboard')} showDashboard={false} onHomeClick={() => navigate('/')} />

      <main className="pb-20 pt-10">
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#0f1d35] via-[#112443] to-[#0a1628]">
          <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
            <div>
              <button
                onClick={() => navigate('/#services')}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 transition-all hover:bg-white/10"
              >
                Back to Services
              </button>
              <div className="mt-6 inline-flex rounded-full bg-cyan-500/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">
                {service.badge}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
                {service.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100/75">
                {service.intro}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {service.deliverables.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/90"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-900/20">
              <div className="relative h-full min-h-[320px]">
                <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071221] via-[#071221]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Included In This Card</p>
                  <p className="mt-3 text-base leading-7 text-blue-50/80">{service.description}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-300">All Services Under This Card</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Detailed Service Breakdown</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {service.sections.map((section, index) => (
              <article key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-white">{section.title}</h3>
                <div className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-[#10213d] px-4 py-4">
                      <p className="text-sm leading-7 text-blue-100/80">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Next Step</p>
            <h3 className="mt-3 text-3xl font-black text-white">Request this service</h3>
            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100/75">
              If this service card matches what you need, head back to the service request form and submit your request for admin review.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigate({
                    pathname: '/',
                    search: `?requestType=service&service=${encodeURIComponent(service.title)}`,
                    hash: '#contact',
                  })
                }
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
              >
                Go to Request Form
              </button>
              <button
                onClick={() =>
                  navigate({
                    pathname: '/',
                    hash: '#services',
                  })
                }
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white"
              >
                View Other Cards
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default ServiceDetail;
