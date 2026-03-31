export type CurriculumSessionDefinition = {
  label: string;
  title: string;
  focus: string;
  outcomes: string[];
  tools: string[];
  concepts: string[];
  lab: string;
  applications: string[];
};

export const IT_SUPPORT_CUSTOMER_CARE_COURSE = 'IT Support & Customer Care';

export const IT_SUPPORT_CUSTOMER_CARE_CURRICULUM: CurriculumSessionDefinition[] = [
  {
    label: '1. Introduction to IT Support & Customer Care (1h)',
    title: 'Introduction to IT Support & Customer Care',
    focus: 'the role of IT support, customer care expectations, service environments, communication basics, and the value of reliable technical assistance',
    outcomes: [
      'describe the purpose of IT support and customer care',
      'identify the responsibilities of a support professional',
      'connect service quality to user trust and business continuity',
    ],
    tools: ['help desk', 'service request', 'ticket', 'customer experience'],
    concepts: ['support roles', 'service mindset', 'communication basics', 'user satisfaction'],
    lab: 'Map the journey of a user reporting an issue, from first contact to confirmation that service has been restored.',
    applications: ['school ICT departments', 'business helpdesks', 'remote support teams'],
  },
  {
    label: '2. IT Support & Customer Care Foundations (1h 30m)',
    title: 'IT Support & Customer Care Foundations',
    focus: 'support lifecycle fundamentals including ticket logging, prioritization, SLAs, empathy, documentation, and professional conduct',
    outcomes: [
      'explain the basic workflow of a support request',
      'distinguish priorities, urgency, and impact when handling tickets',
      'show how empathy and documentation improve service outcomes',
    ],
    tools: ['SLA', 'priority matrix', 'ticket notes', 'escalation'],
    concepts: ['triage', 'response targets', 'professional etiquette', 'service documentation'],
    lab: 'Classify sample incidents by priority and draft the first update a support officer would send to the user.',
    applications: ['call centers', 'managed service providers', 'campus support desks'],
  },
  {
    label: '3. IT Support & Customer Care Core Components (1h 30m)',
    title: 'IT Support & Customer Care Core Components',
    focus: 'the main elements of a support function such as hardware support, software support, user accounts, connectivity support, and remote assistance',
    outcomes: [
      'identify the major service areas handled by IT support teams',
      'match common incidents to the right support component',
      'explain when a request needs remote support or escalation',
    ],
    tools: ['remote desktop', 'user account', 'device inventory', 'incident category'],
    concepts: ['hardware support', 'software support', 'network support', 'access management'],
    lab: 'Group a list of reported issues into hardware, software, account, and connectivity support queues.',
    applications: ['office support operations', 'computer labs', 'field support teams'],
  },
  {
    label: '4. IT Support & Customer Care Design & Architecture (1h 30m)',
    title: 'IT Support & Customer Care Design & Architecture',
    focus: 'how support services are structured through tiered teams, knowledge bases, service desks, asset tracking, and workflow architecture',
    outcomes: [
      'describe tier 1, tier 2, and tier 3 support structures',
      'explain how knowledge bases and asset records support faster resolution',
      'outline an effective support workflow architecture',
    ],
    tools: ['service desk platform', 'knowledge base', 'asset register', 'support tiers'],
    concepts: ['tiered support', 'workflow design', 'knowledge management', 'service visibility'],
    lab: 'Design a simple service desk workflow showing intake, assignment, escalation, resolution, and closure.',
    applications: ['enterprise IT departments', 'outsourced support centers', 'growing SMEs'],
  },
  {
    label: '5. IT Support & Customer Care Methods & Techniques (1h)',
    title: 'IT Support & Customer Care Methods & Techniques',
    focus: 'active listening, effective questioning, structured troubleshooting methods, communication techniques, and resolution confirmation practices',
    outcomes: [
      'use questioning techniques to gather useful incident details',
      'apply a step-by-step troubleshooting method',
      'communicate resolutions clearly and professionally',
    ],
    tools: ['active listening', 'diagnostic questions', 'troubleshooting flow', 'resolution summary'],
    concepts: ['fact finding', 'user communication', 'methodical diagnosis', 'closure confirmation'],
    lab: 'Role-play a support call where the technician gathers facts, tests likely causes, and confirms the final resolution.',
    applications: ['live support calls', 'onsite troubleshooting', 'chat-based customer support'],
  },
  {
    label: '6. IT Support & Customer Care Implementation Practice (1h 30m)',
    title: 'IT Support & Customer Care Implementation Practice',
    focus: 'hands-on delivery of support services including onboarding, software setup, account creation, maintenance routines, and ticket follow-through',
    outcomes: [
      'carry out common support implementation tasks correctly',
      'document work performed in a clear service record',
      'connect operational routines to dependable support delivery',
    ],
    tools: ['user onboarding checklist', 'installation guide', 'maintenance schedule', 'service log'],
    concepts: ['implementation workflow', 'configuration practice', 'service follow-up', 'operational consistency'],
    lab: 'Prepare a checklist for onboarding a new staff member, including device setup, account creation, access checks, and handover notes.',
    applications: ['employee onboarding', 'lab setup projects', 'support operations management'],
  },
  {
    label: '7. IT Support & Customer Care Analysis & Troubleshooting (1h)',
    title: 'IT Support & Customer Care Analysis & Troubleshooting',
    focus: 'incident analysis, root-cause thinking, diagnostic tools, common failure patterns, and effective escalation decisions',
    outcomes: [
      'analyze an incident before applying a fix',
      'distinguish symptoms from root causes',
      'decide when to resolve, escalate, or monitor an issue',
    ],
    tools: ['logs', 'checklist', 'root cause', 'diagnostic utility'],
    concepts: ['problem isolation', 'evidence gathering', 'pattern recognition', 'escalation judgment'],
    lab: 'Investigate a recurring printer or connectivity complaint and document the root cause, corrective action, and follow-up plan.',
    applications: ['incident response teams', 'technical support centers', 'field maintenance work'],
  },
  {
    label: '8. IT Support & Customer Care Security & Best Practices (1h)',
    title: 'IT Support & Customer Care Security & Best Practices',
    focus: 'secure support behavior including password handling, least privilege, phishing awareness, data privacy, documentation quality, and preventive practice',
    outcomes: [
      'identify security responsibilities within everyday support work',
      'apply best practices that reduce avoidable incidents',
      'protect user data while resolving technical issues',
    ],
    tools: ['least privilege', 'password policy', 'verification step', 'backup routine'],
    concepts: ['security awareness', 'privacy protection', 'preventive maintenance', 'support discipline'],
    lab: 'Review a support scenario for security gaps and rewrite the process using safer handling, verification, and documentation steps.',
    applications: ['regulated organizations', 'education institutions', 'business continuity planning'],
  },
  {
    label: '9. IT Support & Customer Care Applications & Case Studies (1h 30m)',
    title: 'IT Support & Customer Care Applications & Case Studies',
    focus: 'real service cases, applied troubleshooting stories, customer-care scenarios, incident review, and lessons learned from support environments',
    outcomes: [
      'analyze how support principles work in real cases',
      'compare strong and weak customer-care responses',
      'recommend improvements based on incident outcomes',
    ],
    tools: ['case review', 'incident report', 'service improvement note', 'customer feedback'],
    concepts: ['case analysis', 'service recovery', 'continuous improvement', 'practical reflection'],
    lab: 'Study two support case studies and identify what improved resolution time, user satisfaction, and repeat-incident prevention.',
    applications: ['post-incident review meetings', 'support training', 'quality improvement programs'],
  },
  {
    label: '10. IT Support & Customer Care Capstone Review (1h)',
    title: 'IT Support & Customer Care Capstone Review',
    focus: 'full-course revision, integrated support scenarios, readiness checks, and preparation for the final assessment across all previous topics',
    outcomes: [
      'synthesize the major lessons from the full course',
      'demonstrate readiness for topic quizzes and the final exam',
      'explain a complete support workflow from incident intake to closure',
    ],
    tools: ['revision checklist', 'mock incident', 'knowledge recap', 'exam readiness'],
    concepts: ['course integration', 'workflow mastery', 'exam preparation', 'professional confidence'],
    lab: 'Run a mock support case from first contact through troubleshooting, communication, documentation, closure, and post-resolution review.',
    applications: ['course completion review', 'job-readiness preparation', 'final exam preparation'],
  },
];

export const IT_SUPPORT_CUSTOMER_CARE_TRACK = {
  title: 'IT Support & Customer Care Certification',
  description: 'A 10-topic guided path covering IT support delivery, customer care, troubleshooting, security, review, and a final exam.',
  sessions: IT_SUPPORT_CUSTOMER_CARE_CURRICULUM.map((session) => session.label),
};
