import React from 'react';

export const businessSolutions = [
  {
    id: 'academic-administration',
    number: '01',
    title: 'Academic Administration System',
    description: 'Bring admissions, student records, fees, timetables, and academic reporting together in one organized workspace.',
  },
  {
    id: 'pension-administration',
    number: '02',
    title: 'Pension Administration System',
    description: 'Manage member records, contributions, benefits, and pension workflows with clear, dependable processes.',
  },
  {
    id: 'agri-production',
    number: '03',
    title: 'Agri-Production System',
    description: 'Coordinate farm operations, production, inventory, and performance data from planning through harvest.',
  },
  {
    id: 'e-dairy',
    number: '04',
    title: 'E-Dairy Solution',
    description: 'Connect farmer records, milk collection, deliveries, and payment tracking in a single digital flow.',
  },
  {
    id: 'sacco-microfinance',
    number: '05',
    title: 'Sacco & Microfinance System',
    description: 'Support member management, savings, loans, repayments, and reporting with tools designed for financial institutions.',
  },
  {
    id: 'financial-management',
    number: '06',
    title: 'Financial Management Solution',
    description: 'Make budgeting, expenses, approvals, and financial reporting easier to manage and review.',
  },
] as const;

export const productPlatforms = [
  'Microsoft Dynamics 365 Business Central',
  'Microsoft Dynamics NAV',
  'Microsoft SharePoint',
  'Microsoft Fabric',
  'Microsoft Power BI',
  'Microsoft Dynamics CRM',
] as const;

const SolutionsSection: React.FC = () => (
  <section id="solutions" className="relative overflow-hidden bg-[#081426] py-20 sm:py-24">
    <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
    <div className="pointer-events-none absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
          Business Solutions
        </span>
        <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Purpose-built systems for <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">the way you work.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-100/65 sm:text-lg">
          Replace scattered processes with connected, practical software designed around your organization, your people, and your goals.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {businessSolutions.map((solution) => (
          <article
            id={`solution-${solution.id}`}
            key={solution.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.025] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-2xl hover:shadow-cyan-950/40 sm:p-7"
          >
            <div className="mb-7 flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-sm font-black tracking-widest text-cyan-200">
                {solution.number}
              </span>
              <span className="h-px w-16 bg-gradient-to-r from-cyan-300/50 to-transparent transition-all group-hover:w-24" />
            </div>
            <h3 className="text-xl font-bold leading-snug text-white">{solution.title}</h3>
            <p className="mt-3 min-h-[5.25rem] text-sm leading-6 text-blue-100/60">{solution.description}</p>
            <button
              type="button"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors hover:text-white"
            >
              Discuss this solution
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </article>
        ))}
      </div>

      <div id="products" className="mt-14 rounded-3xl border border-white/10 bg-[#10213a]/80 p-6 shadow-2xl shadow-black/10 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Products & Platforms</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Tools to connect your business</h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-blue-100/55">We help organizations implement, customize, and get more from the platforms they already use.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {productPlatforms.map((product) => (
            <div key={product} className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium leading-5 text-blue-50/85 transition-colors hover:border-cyan-300/30 hover:bg-cyan-400/[0.06]">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" />
              {product}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default SolutionsSection;