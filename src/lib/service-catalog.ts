export type ServiceDetailSection = {
  title: string;
  items: string[];
};

export type ServiceCatalogItem = {
  id: number;
  slug: string;
  category: string;
  badge: string;
  title: string;
  description: string;
  deliverables: string[];
  image: string;
  intro: string;
  sections: ServiceDetailSection[];
};

export const serviceCatalog: ServiceCatalogItem[] = [
  {
    id: 1,
    slug: 'software-development',
    category: 'development',
    badge: 'Build',
    title: 'Software Development',
    description: 'Custom application development for web, mobile, and desktop, plus API design, full-stack engineering, testing, debugging, and long-term maintenance.',
    deliverables: ['web mobile desktop', 'API integration', 'testing updates'],
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80',
    intro: 'Software development services focus on building tailored digital systems from scratch so the final solution fits the exact business workflow, users, and operational goals.',
    sections: [
      {
        title: 'Custom Software Development',
        items: [
          'Enterprise systems such as ERP and CRM platforms.',
          'Internal tools, admin portals, dashboards, and reporting systems.',
          'Automation software for recurring business processes.',
        ],
      },
      {
        title: 'Engineering Delivery',
        items: [
          'Full-stack system architecture and implementation.',
          'API design for internal and external integrations.',
          'Scalable codebases for web, desktop, and connected business platforms.',
        ],
      },
      {
        title: 'Quality and Lifecycle Support',
        items: [
          'Testing, debugging, and release hardening.',
          'Performance improvements and structured upgrades.',
          'Long-term maintenance after launch.',
        ],
      },
    ],
  },
  {
    id: 2,
    slug: 'web-app-development',
    category: 'development',
    badge: 'Apps',
    title: 'Web & App Development',
    description: 'Website design and development, e-commerce platform creation, mobile apps, UI/UX improvement, and Progressive Web Apps.',
    deliverables: ['websites stores', 'mobile apps', 'UI UX PWAs'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1080&q=80',
    intro: 'Web and app development services cover browser-based platforms, mobile apps, and the backend systems that support them, from concept to deployment.',
    sections: [
      {
        title: 'Web Development Services',
        items: [
          'Frontend development for responsive interfaces, forms, animations, and interactive layouts.',
          'Backend development for servers, databases, authentication, and business logic.',
          'Full-stack web applications such as dashboards, booking systems, SaaS products, and e-commerce platforms.',
          'CMS-based builds and content-driven platforms.',
          'Website maintenance, optimization, and SEO improvements.',
        ],
      },
      {
        title: 'App Development Services',
        items: [
          'Native Android and iOS app development.',
          'Cross-platform mobile apps using one shared codebase.',
          'App UI/UX design, prototypes, and navigation flows.',
          'Backend APIs, cloud storage, notifications, and account systems for apps.',
          'Testing, deployment to app stores, and post-launch updates.',
        ],
      },
      {
        title: 'Typical Outcomes',
        items: [
          'Business websites and portals.',
          'Installed mobile apps for Android and iPhone users.',
          'Web apps that behave like products without requiring an install.',
        ],
      },
    ],
  },
  {
    id: 3,
    slug: 'artificial-intelligence-machine-learning',
    category: 'ai',
    badge: 'AI',
    title: 'Artificial Intelligence & Machine Learning',
    description: 'Predictive models, natural language processing, chatbots, text analysis, computer vision, recommendation systems, and AI strategy consulting.',
    deliverables: ['predictive models', 'NLP chatbots', 'computer vision'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1080&q=80',
    intro: 'AI and machine learning services focus on building systems that learn from data, automate decisions, and add intelligent behavior to digital products.',
    sections: [
      {
        title: 'Model and Data Work',
        items: [
          'Machine learning model development for forecasting, classification, recommendations, and detection.',
          'Data collection, labeling, cleaning, preprocessing, and feature engineering.',
          'Deep learning solutions for speech, images, video, and complex pattern recognition.',
        ],
      },
      {
        title: 'Applied AI Capabilities',
        items: [
          'Natural language processing for chatbots, assistants, sentiment analysis, summarization, and translation.',
          'Computer vision for recognition, detection, and image interpretation.',
          'AI-powered automation for workflows, documents, approvals, and repetitive tasks.',
        ],
      },
      {
        title: 'Integration and Operations',
        items: [
          'AI feature integration into websites, apps, and existing systems.',
          'Model deployment, monitoring, retraining, and MLOps pipelines.',
          'AI consulting, use-case planning, ethics, explainability, and bias reviews.',
        ],
      },
    ],
  },
  {
    id: 4,
    slug: 'data-science-analytics',
    category: 'ai',
    badge: 'Data',
    title: 'Data Science & Analytics',
    description: 'Data collection and cleaning, visualization dashboards, big data processing, business intelligence, forecasting, and statistical analysis.',
    deliverables: ['data cleaning', 'dashboards BI', 'forecasting'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1080&q=80',
    intro: 'Data science and analytics services turn raw business data into insight, forecasting, and decision support through structured analysis and reporting.',
    sections: [
      {
        title: 'Data Foundation',
        items: [
          'Data collection from databases, APIs, spreadsheets, and external systems.',
          'Data cleaning, preparation, transformation, and validation.',
          'Data warehousing and ETL pipeline design.',
        ],
      },
      {
        title: 'Analysis and Intelligence',
        items: [
          'Exploratory data analysis to identify patterns, anomalies, and trends.',
          'Statistical analysis, regression, testing, and experiment review.',
          'Predictive analytics for forecasting, churn, and planning.',
        ],
      },
      {
        title: 'Visualization and Reporting',
        items: [
          'Interactive dashboards, KPIs, charts, and management reports.',
          'Business intelligence systems for operations, sales, and performance tracking.',
          'Big data analytics for larger or faster-moving datasets.',
        ],
      },
    ],
  },
  {
    id: 5,
    slug: 'cybersecurity',
    category: 'infrastructure',
    badge: 'Secure',
    title: 'Cybersecurity',
    description: 'Security audits, vulnerability assessments, penetration testing, network security, encryption, data protection, and incident response.',
    deliverables: ['security audits', 'penetration tests', 'incident recovery'],
    image: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1080&q=80',
    intro: 'Cybersecurity services protect applications, infrastructure, users, and data against digital threats while improving compliance and operational resilience.',
    sections: [
      {
        title: 'Core Protection Services',
        items: [
          'Network security architecture, monitoring, and hardening.',
          'Application security reviews, secure coding checks, and vulnerability scanning.',
          'Information security controls, encryption, access control, and data protection.',
        ],
      },
      {
        title: 'Assessment and Response',
        items: [
          'Penetration testing, ethical hacking, and vulnerability assessments.',
          'Incident response planning, breach handling, and recovery support.',
          'Endpoint security and ongoing protective maintenance.',
        ],
      },
      {
        title: 'Governance and Readiness',
        items: [
          'Identity and access management including MFA and role-based access.',
          'Cloud security reviews and monitoring.',
          'Risk assessment, compliance support, and user security awareness training.',
        ],
      },
    ],
  },
  {
    id: 6,
    slug: 'cloud-computing-devops',
    category: 'infrastructure',
    badge: 'Cloud',
    title: 'Cloud Computing & DevOps',
    description: 'Cloud infrastructure setup, CI/CD pipelines, Docker and Kubernetes, system monitoring, scaling, and deployment automation.',
    deliverables: ['AWS Azure GCP', 'CI CD', 'Docker Kubernetes'],
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1080&q=80',
    intro: 'Cloud computing and DevOps services help teams host, deploy, scale, automate, and maintain modern digital systems with speed and reliability.',
    sections: [
      {
        title: 'Cloud Computing Services',
        items: [
          'Cloud infrastructure setup with servers, networking, storage, and architecture planning.',
          'Cloud migration for applications, data, and legacy systems.',
          'Cloud-native application design, managed databases, and disaster recovery planning.',
        ],
      },
      {
        title: 'DevOps Services',
        items: [
          'CI/CD pipeline setup for automated build, test, and deployment workflows.',
          'Infrastructure as code using repeatable configuration and provisioning.',
          'Containerization with Docker and orchestration with Kubernetes.',
        ],
      },
      {
        title: 'Reliability and Optimization',
        items: [
          'Monitoring, logging, alerting, and system health visibility.',
          'Automation to reduce manual deployment and operations work.',
          'Scalability, cost optimization, and release reliability improvements.',
        ],
      },
    ],
  },
  {
    id: 7,
    slug: 'it-consulting-systems-design',
    category: 'infrastructure',
    badge: 'Design',
    title: 'IT Consulting & Systems Design',
    description: 'Technology strategy, system architecture, digital transformation planning, performance optimization, and legacy system modernization.',
    deliverables: ['strategy consulting', 'architecture design', 'modernization'],
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80',
    intro: 'IT consulting and systems design services help businesses choose the right technology, define scope clearly, and structure systems before and during delivery.',
    sections: [
      {
        title: 'IT Consulting Services',
        items: [
          'Technology strategy, planning, digital roadmaps, and budgeting guidance.',
          'Requirements analysis and solution scoping.',
          'Technology selection for platforms, languages, databases, cloud providers, and integrations.',
          'Infrastructure consulting, digital transformation advice, and project management support.',
        ],
      },
      {
        title: 'Systems Design Services',
        items: [
          'System architecture design for scalable and maintainable platforms.',
          'Database design, data flows, and storage planning.',
          'API design for communication between services and platforms.',
          'Security architecture, access control, encryption strategy, and secure data flow planning.',
        ],
      },
      {
        title: 'Performance and Growth',
        items: [
          'Scalability and performance design for growth readiness.',
          'Deployment architecture planning with CI/CD and cloud hosting.',
          'Legacy modernization strategy for older systems and processes.',
        ],
      },
    ],
  },
  {
    id: 8,
    slug: 'technical-support-maintenance',
    category: 'infrastructure',
    badge: 'Support',
    title: 'Technical Support & Maintenance',
    description: 'Troubleshooting hardware and software issues, system upgrades, database maintenance, server management, backup, and recovery.',
    deliverables: ['troubleshooting', 'server management', 'backup recovery'],
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1080&q=80',
    intro: 'Technical support and maintenance services keep systems stable after launch by resolving issues quickly and improving performance over time.',
    sections: [
      {
        title: 'Operational Support',
        items: [
          'Help desk and user support for software, hardware, and account issues.',
          'Bug fixing, troubleshooting, and issue resolution.',
          'System monitoring with alerts for downtime, failure, and unusual behavior.',
        ],
      },
      {
        title: 'Maintenance Services',
        items: [
          'Software updates, version upgrades, and security patching.',
          'Performance optimization for applications, databases, and servers.',
          'Infrastructure maintenance for networks, servers, and cloud systems.',
        ],
      },
      {
        title: 'Recovery and Service Quality',
        items: [
          'Backup planning, disaster recovery, and restoration support.',
          'Security maintenance and vulnerability follow-up.',
          'Documentation, knowledge bases, SLA planning, and support process design.',
        ],
      },
    ],
  },
  {
    id: 9,
    slug: 'game-development',
    category: 'specialized',
    badge: 'Game',
    title: 'Game Development',
    description: 'Game design and programming, graphics and animation integration, multiplayer systems, testing, and optimization.',
    deliverables: ['game programming', 'graphics animation', 'multiplayer'],
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1080&q=80',
    intro: 'Game development services combine software engineering, art, interaction design, and performance optimization to create playable digital experiences.',
    sections: [
      {
        title: 'Game Production',
        items: [
          'Game concept design, mechanics, progression systems, and storytelling.',
          'Gameplay programming for movement, combat, AI, and physics.',
          '2D and 3D asset integration including character, environment, and animation work.',
        ],
      },
      {
        title: 'Platform and Engine Work',
        items: [
          'Development with engines such as Unity, Unreal Engine, and Godot.',
          'Mobile game development for Android and iOS.',
          'PC, console, AR, VR, and multiplayer online game architecture.',
        ],
      },
      {
        title: 'Launch and Growth',
        items: [
          'Testing, balancing, and performance optimization.',
          'Monetization systems such as ads, purchases, subscriptions, or progression economies.',
          'Publishing, post-launch updates, events, and ongoing feature releases.',
        ],
      },
    ],
  },
  {
    id: 10,
    slug: 'training-education',
    category: 'training',
    badge: 'Teach',
    title: 'Training & Education',
    description: 'Teaching programming, workshops, bootcamps, corporate training, mentorship, and code reviews for learners and teams.',
    deliverables: ['programming training', 'bootcamps', 'mentorship'],
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1080&q=80',
    intro: 'Training and education services focus on structured learning, guided practice, workshops, and certification-ready teaching experiences for individuals and teams.',
    sections: [
      {
        title: 'Learning Delivery',
        items: [
          'Programming training for beginners, students, and professionals.',
          'Workshops, bootcamps, and practical hands-on sessions.',
          'Corporate learning tracks for teams and institutions.',
        ],
      },
      {
        title: 'Coaching and Support',
        items: [
          'One-on-one mentorship and guided skill development.',
          'Code reviews and technical feedback for learners.',
          'Structured support for revision, exercises, and project work.',
        ],
      },
      {
        title: 'Education Outcomes',
        items: [
          'Clear topic-by-topic learning progress.',
          'Practical knowledge transfer tied to real systems and projects.',
          'Preparation for certification paths and long-term technical growth.',
        ],
      },
    ],
  },
  {
    id: 11,
    slug: 'specialized-areas',
    category: 'specialized',
    badge: 'Deep Tech',
    title: 'Specialized Areas',
    description: 'Blockchain and smart contracts, IoT solutions, embedded systems, robotics development, and AR/VR applications.',
    deliverables: ['blockchain IoT', 'embedded robotics', 'AR VR'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1080&q=80',
    intro: 'Specialized areas cover niche and advanced technology work that requires deeper domain expertise than standard software projects.',
    sections: [
      {
        title: 'Advanced Technology Domains',
        items: [
          'Artificial intelligence, machine learning, and advanced analytics systems.',
          'Cybersecurity, cloud architecture, DevOps, and site reliability engineering.',
          'IoT, robotics, embedded systems, and automation platforms.',
        ],
      },
      {
        title: 'Emerging and Niche Platforms',
        items: [
          'Blockchain applications, smart contracts, wallets, and decentralized platforms.',
          'AR, VR, and mixed reality experiences for training, retail, education, or entertainment.',
          'Game and simulation systems with specialized interaction models.',
        ],
      },
      {
        title: 'Industry-Specific Innovation',
        items: [
          'Fintech, healthtech, edtech, govtech, and custom business applications.',
          'Research-led prototypes and emerging technical experiments.',
          'Deep-technical consulting for high-complexity digital transformation work.',
        ],
      },
    ],
  },
  {
    id: 12,
    slug: 'freelance-business-services',
    category: 'business',
    badge: 'Startup',
    title: 'Freelance & Business Services',
    description: 'Technical documentation, project management, code auditing, agile delivery support, and MVP development for startups.',
    deliverables: ['technical docs', 'Agile Scrum', 'MVP development'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1080&q=80',
    intro: 'Freelance and business services focus on packaging technical skills into client delivery, startup execution, consulting, and digital business operations.',
    sections: [
      {
        title: 'Freelance Service Delivery',
        items: [
          'Web, app, software, support, AI, cloud, and cybersecurity services delivered directly to clients.',
          'Technical documentation, audits, troubleshooting, and implementation support.',
          'Project-based, hourly, or retainer-based delivery models.',
        ],
      },
      {
        title: 'Business-Focused Services',
        items: [
          'Software agency support for custom client solutions.',
          'IT consulting and structured project planning.',
          'MVP development for startups and new product teams.',
          'Managed IT service offerings and recurring support packages.',
        ],
      },
      {
        title: 'Commercial Models and Growth',
        items: [
          'SaaS product planning and subscription-ready digital services.',
          'Agile and Scrum project coordination for teams and founders.',
          'Training, education, and internal capability-building services for organizations.',
        ],
      },
    ],
  },
];

export function findServiceBySlug(slug: string) {
  return serviceCatalog.find((service) => service.slug === slug);
}
