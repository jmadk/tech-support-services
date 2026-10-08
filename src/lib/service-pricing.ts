export type RequestType = 'service' | 'class';
export type ServiceComplexity = 'starter' | 'professional' | 'enterprise';
export type PaymentMethod = 'mpesa' | 'manual_mpesa' | 'card' | 'bank';

export const SERVICE_OPTIONS = [
  'Software Development',
  'Web & App Development',
  'Artificial Intelligence & Machine Learning',
  'Data Science & Analytics',
  'Cybersecurity',
  'Cloud Computing & DevOps',
  'IT Consulting & Systems Design',
  'Technical Support & Maintenance',
  'Game Development',
  'Training & Education',
  'Specialized Areas',
  'Freelance & Business Services',
] as const;

export const CLASS_OPTIONS = [
  'IT Support & Customer Care',
  'Database Systems',
  'Data Communications & Networks',
  'Distributed Systems',
  'Data Structures & Algorithms',
  'Operating Systems',
  'Software Engineering',
  'Web Development',
  'Computer Security',
] as const;

export const COMPLEXITY_OPTIONS: Array<{
  id: ServiceComplexity;
  label: string;
  period: string;
  description: string;
}> = [
  {
    id: 'starter',
    label: 'Starter Scope',
    period: '/discovery',
    description: 'Best for smaller builds, first consultations, audits, or scoped feature work.',
  },
  {
    id: 'professional',
    label: 'Professional Build',
    period: '/project phase',
    description: 'Balanced for active delivery, integrations, production-ready implementation, and support.',
  },
  {
    id: 'enterprise',
    label: 'Enterprise Rollout',
    period: '/solution',
    description: 'Designed for larger systems, advanced AI work, multi-team delivery, or long-running products.',
  },
];

type PriceBand = {
  starter: number;
  professional: number;
  enterprise: number;
};

const MINIMUM_SERVICE_PRICES: PriceBand = {
  starter: 50000,
  professional: 80000,
  enterprise: 155000,
};

const DEFAULT_PRICES: PriceBand = {
  starter: 14000,
  professional: 52000,
  enterprise: 155000,
};

const SERVICE_PRICING: Record<string, PriceBand> = {
  'Software Development': {
    starter: 16000,
    professional: 58000,
    enterprise: 168000,
  },
  'Web & App Development': {
    starter: 15000,
    professional: 54000,
    enterprise: 162000,
  },
  'Artificial Intelligence & Machine Learning': {
    starter: 22000,
    professional: 76000,
    enterprise: 195000,
  },
  'Data Science & Analytics': {
    starter: 18000,
    professional: 62000,
    enterprise: 176000,
  },
  'Cybersecurity': {
    starter: 20000,
    professional: 68000,
    enterprise: 185000,
  },
  'Cloud Computing & DevOps': {
    starter: 19000,
    professional: 66000,
    enterprise: 182000,
  },
  'IT Consulting & Systems Design': {
    starter: 15000,
    professional: 56000,
    enterprise: 164000,
  },
  'Technical Support & Maintenance': {
    starter: 12000,
    professional: 45000,
    enterprise: 138000,
  },
  'Game Development': {
    starter: 20000,
    professional: 70000,
    enterprise: 190000,
  },
  'Training & Education': {
    starter: 12000,
    professional: 40000,
    enterprise: 120000,
  },
  'Specialized Areas': {
    starter: 24000,
    professional: 82000,
    enterprise: 210000,
  },
  'Freelance & Business Services': {
    starter: 13000,
    professional: 48000,
    enterprise: 145000,
  },
};

export function formatKes(amount: number) {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

export function getServicePrice(service: string, complexity: ServiceComplexity) {
  const priceBand = SERVICE_PRICING[service] || DEFAULT_PRICES;
  return Math.max(MINIMUM_SERVICE_PRICES[complexity], priceBand[complexity]);
}

export function getComplexityLabel(complexity: ServiceComplexity) {
  return COMPLEXITY_OPTIONS.find((option) => option.id === complexity)?.label || 'Selected Scope';
}

export function getServicePricingSummary(service: string) {
  return {
    starter: getServicePrice(service, 'starter'),
    professional: getServicePrice(service, 'professional'),
    enterprise: getServicePrice(service, 'enterprise'),
  };
}

export const PAYMENT_METHOD_OPTIONS: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
}> = [
  {
    id: 'mpesa',
    label: 'M-Pesa STK Push',
    description: 'Primary payment method. Initiate checkout from the site directly to your phone.',
  },
  {
    id: 'manual_mpesa',
    label: 'Send to 0757152440',
    description: 'Manual M-Pesa fallback. Client pays directly to your number and keeps the receipt for confirmation.',
  },
  {
    id: 'card',
    label: 'Debit/Credit Card',
    description: 'Shown as an alternative checkout path for clients who prefer card payments.',
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    description: 'Included as an option, but bank settlement stays unavailable until banking details are added.',
  },
];
