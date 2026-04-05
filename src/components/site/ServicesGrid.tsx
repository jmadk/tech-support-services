import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { serviceCatalog } from '@/lib/service-catalog';

const serviceCategories = [
  { id: 'all', label: 'All Services' },
  { id: 'development', label: 'Development' },
  { id: 'ai', label: 'AI & Data' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'training', label: 'Training' },
  { id: 'specialized', label: 'Specialized' },
  { id: 'business', label: 'Business Services' },
];

const expertServices = serviceCatalog;

const ServicesGrid: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setSavedTitles(new Set());
      return;
    }
    const loadData = async () => {
      const { savedServices } = await api.getSavedServices();
      setSavedTitles(new Set(savedServices.map((item) => item.service_title)));
    };
    loadData();
  }, [user]);

  const filteredServices = useMemo(() => expertServices.filter((service) => {
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || service.title.toLowerCase().includes(q) || service.description.toLowerCase().includes(q) || service.deliverables.some((item) => item.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  }), [activeCategory, searchQuery]);

  const toggleSave = async (event: React.MouseEvent, service: typeof expertServices[number]) => {
    event.stopPropagation();
    if (!user) return;
    setSavingId(service.id);
    if (savedTitles.has(service.title)) {
      const { savedServices } = await api.getSavedServices();
      const existing = savedServices.find((item) => item.service_title === service.title);
      if (existing) await api.deleteSavedService(existing.id);
      setSavedTitles((prev) => {
        const next = new Set(prev);
        next.delete(service.title);
        return next;
      });
    } else {
      await api.saveService({
        service_title: service.title,
        service_category: service.category,
        service_description: service.description,
      });
      setSavedTitles((prev) => new Set(prev).add(service.title));
    }
    setSavingId(null);
  };

  const openServiceCard = (serviceSlug: string) => {
    if (serviceSlug === 'training-education') {
      navigate('/training-education');
      return;
    }

    navigate(`/services/${serviceSlug}`);
  };

  return (
    <section id="services" className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0f1d35] to-[#0a1628] py-24">
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
            <span className="text-sm font-medium text-cyan-300">Services, Classes & Certification</span>
          </div>
          <h2 className="mb-4 text-4xl font-extrabold text-white sm:text-5xl">
            Choose Between <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Expert Service</span> and <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">Learning Path</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-blue-200/60">
            Expert services stay available here, and the training journey now opens directly from the Training & Education service card.
          </p>
        </div>

        <div className="mb-24">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Expert Services</p>
              <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">High-impact digital solutions for businesses, teams, and serious founders.</h3>
              <p className="mt-3 text-base leading-7 text-blue-200/60">From custom software and AI systems to cloud delivery, cybersecurity, and technical training, these services are built to help clients launch faster, operate smarter, and scale with confidence.</p>
            </div>

            <div className="w-full max-w-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expert services..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white outline-none transition-all placeholder:text-blue-300/40 focus:border-cyan-500/50 focus:bg-white/10"
              />
            </div>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {serviceCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' : 'border border-white/10 bg-white/5 text-blue-200/60 hover:bg-white/10 hover:text-white'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <p className="mb-6 text-center text-sm text-blue-300/40">Showing {filteredServices.length} of {expertServices.length} expert services</p>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => openServiceCard(service.slug)}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-white/10 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={service.image} alt={service.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/45 to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-cyan-500/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">{service.badge}</div>
                  {user && (
                    <button
                      onClick={(event) => toggleSave(event, service)}
                      disabled={savingId === service.id}
                      className={`absolute right-3 top-3 rounded-xl px-3 py-2 text-xs font-bold transition-all ${savedTitles.has(service.title) ? 'bg-cyan-500 text-white' : 'bg-black/35 text-white/75 backdrop-blur-sm hover:bg-black/50 hover:text-white'}`}
                    >
                      {savedTitles.has(service.title) ? 'Saved' : 'Save'}
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <h4 className="text-lg font-bold text-white transition-colors group-hover:text-cyan-300">{service.title}</h4>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-blue-200/55">{service.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {service.deliverables.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-100/80">{item}</span>
                    ))}
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openServiceCard(service.slug);
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:from-cyan-400 hover:to-blue-500"
                    >
                      View Full Service Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;
