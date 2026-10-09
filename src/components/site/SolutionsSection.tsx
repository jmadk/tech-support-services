import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

type ProductDetail = { title: string; summary: string; description: string; applications: string[] };

const productDetails: ProductDetail[] = [
  {
    title: 'Microsoft Dynamics 365 Business Central',
    summary: 'Connect finance, sales, purchasing, inventory, and everyday operations in one business management system.',
    description: 'Business Central gives growing organizations a clearer view of how work moves across the business. KCJ Tech can help shape an implementation around your processes, reduce duplicate data entry, and give teams more useful information for day-to-day decisions.',
    applications: ['Academic Administration System', 'Financial Management Solution', 'Supply Chain Management Solution'],
  },
  {
    title: 'Microsoft Dynamics NAV',
    summary: 'A proven enterprise resource planning system for organizations managing finance, sales, inventory, and operations.',
    description: 'For organizations already running Dynamics NAV, the priority is keeping core operations reliable while making the system easier to support and use. We can review the current setup, improve reporting and workflows, and plan a practical modernization path when it makes sense.',
    applications: ['Finance and inventory management', 'Sales and purchasing workflows', 'NAV support and modernization'],
  },
  {
    title: 'Microsoft SharePoint',
    summary: 'Create a more organized digital workplace for documents, team collaboration, and internal information.',
    description: 'SharePoint can bring team sites, shared documents, and important organizational content into a structured workspace. KCJ Tech can help plan permissions, information architecture, and collaboration spaces so staff can find the right materials and work from a clearer source of truth.',
    applications: ['Document and records management', 'Team sites and intranet spaces', 'Collaboration and approval workflows'],
  },
  {
    title: 'Microsoft Fabric',
    summary: 'Bring data preparation, engineering, analytics, and reporting into a connected data platform.',
    description: 'Microsoft Fabric helps organizations connect data work across analytics experiences, with OneLake providing a shared data foundation. KCJ Tech can help assess data sources, shape reporting-ready datasets, and plan an analytics environment for operational questions and longer-term insight.',
    applications: ['Connected analytics foundations', 'Data preparation and consolidation', 'Operational and historical insights'],
  },
  {
    title: 'Microsoft Power BI',
    summary: 'Turn business data into interactive reports and dashboards that help teams see performance clearly.',
    description: 'Power BI helps teams explore trends, monitor key measures, and share a consistent view of performance. We can help define useful metrics, connect appropriate data sources, and design reports that make the next action easier to understand.',
    applications: ['Management dashboards and KPIs', 'Financial and operational reporting', 'Trend and performance analysis'],
  },
  {
    title: 'Microsoft Dynamics CRM',
    summary: 'Keep customer records, sales opportunities, and follow-up activity organized in one relationship management workflow.',
    description: 'Dynamics CRM helps teams keep track of accounts, contacts, leads, opportunities, and customer interactions. KCJ Tech can help map the sales process, organize customer information, and make follow-up activity more visible across the team.',
    applications: ['Lead and opportunity tracking', 'Customer account history', 'Sales activity and pipeline visibility'],
  },
];

const SolutionsSection: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);

  return (
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
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">&rarr;</span>
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
          {productDetails.map((product) => (
            <button
              key={product.title}
              type="button"
              onClick={() => setSelectedProduct(product)}
              className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span className="flex min-w-0 items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400" />
                <span>
                  <span className="block text-sm font-semibold leading-5 text-blue-50/90">{product.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-blue-100/45">Explore overview</span>
                </span>
              </span>
              <span aria-hidden="true" className="flex-shrink-0 text-cyan-300 transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>
          ))}
        </div>
      </div>
    </div>

    <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
      {selectedProduct && (
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-3xl border border-cyan-300/20 bg-[#0d1d33] p-0 text-white shadow-[0_30px_100px_rgba(2,8,23,0.75)]">
          <div className="overflow-hidden rounded-3xl">
            <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400" />
            <div className="p-6 sm:p-9">
              <DialogHeader className="space-y-4 text-left">
                <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200">KCJ Tech Product Brief</span>
                <DialogTitle className="pr-8 text-2xl font-black leading-tight text-white sm:text-3xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription className="text-base leading-7 text-blue-100/75">{selectedProduct.summary}</DialogDescription>
              </DialogHeader>
              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">A clearer way to work</h4>
                <p className="mt-3 text-sm leading-7 text-blue-100/70">{selectedProduct.description}</p>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-white">Where it can make a difference</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProduct.applications.map((application) => (
                    <span key={application} className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-2 text-xs font-medium leading-5 text-cyan-100/85">{application}</span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  window.setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition-all hover:from-cyan-400 hover:to-blue-500 sm:w-auto"
              >Discuss this product</button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  </section>
  );
};

export default SolutionsSection;