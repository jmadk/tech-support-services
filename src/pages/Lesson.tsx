import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api, getErrorMessage, type LessonAssessmentRecord } from '@/lib/api';
import { IT_SUPPORT_CUSTOMER_CARE_COURSE, IT_SUPPORT_CUSTOMER_CARE_CURRICULUM } from '@/lib/it-support-course';

type LessonPhase = 'loading' | 'narrator' | 'qa' | 'quiz' | 'complete' | 'course-summary' | 'final-exam' | 'final-result';
type QuestionSet = Array<{ q: string; options: string[]; correct: number }>;
type QuizResult = {
  score: number;
  correct: number;
  total: number;
  submittedAt: string;
};
type TopicReadState = {
  startedAt: string;
  requiredSeconds: number;
  completedAt: string | null;
};
type CourseProgress = {
  topicScores: Record<string, QuizResult>;
  finalExamResult: QuizResult | null;
  readingProgress: Record<string, TopicReadState>;
};

type LessonInsightCard = {
  title: string;
  detail: string;
};

type LessonVisualExplainer = {
  title: string;
  caption: string;
  variant: 'system' | 'flow' | 'application';
  primary: string;
  items: string[];
  highlights: string[];
};

type LessonData = {
  title: string;
  notes: string[];
  learningObjectives: string[];
  sections: Array<{ title: string; subtopics: Array<{ title: string; content: string[] }> }>;
  keyTerms: string[];
  keyTermDetails: string[];
  visualExplainers: LessonVisualExplainer[];
  background: string[];
  analysisPrompts: string[];
  processFlow: LessonInsightCard[];
  decisionFrames: LessonInsightCard[];
  scenarioSnapshots: LessonInsightCard[];
  commonPitfalls: string[];
  failureSignals: string[];
  deepDiveQuestions: string[];
  workedExample: string[];
  practiceTasks: string[];
  summaryPoints: string[];
  shortTestTips: string[];
  qaQuestions: Array<{ q: string; options: string[]; correct: number }>;
  quizQuestions: Array<{ q: string; options: string[]; correct: number }>;
};

type CurriculumSession = {
  label: string;
  title: string;
  focus: string;
  outcomes: string[];
  tools: string[];
  concepts: string[];
  lab: string;
  applications: string[];
  sequence?: number;
  trackLength?: number;
};

const curriculumTracks: Record<string, CurriculumSession[]> = {
  [IT_SUPPORT_CUSTOMER_CARE_COURSE]: IT_SUPPORT_CUSTOMER_CARE_CURRICULUM,
  'Database Systems': [
    {
      label: 'Introduction to Databases (1h)',
      title: 'Introduction to Databases',
      focus: 'Definition of databases, Characteristics of databases, Functions of DBMS, Types of databases, Database vs file systems, Evolution of database technology, Data persistence concepts, Schema and integrity principles, Structured storage mechanisms, Relational thinking fundamentals, Data lifecycle management, DBMS roles and responsibilities',
      outcomes: ['define databases using multiple perspectives', 'analyze key characteristics distinguishing databases from file systems', 'evaluate different types of databases and their use cases', 'explain the core functions performed by DBMS in data management systems'],
      tools: ['DBMS', 'tables', 'records', 'SQL', 'relational models', 'data integrity constraints', 'schema definitions', 'data lifecycle tools'],
      concepts: ['data persistence', 'schema design', 'data integrity', 'structured storage', 'relational thinking', 'data lifecycle', 'DBMS architecture', 'database evolution'],
      lab: 'Create a small student records schema and compare it with spreadsheet-based storage, analyzing characteristics, functions, and evolution.',
      applications: ['student portals', 'inventory systems', 'hospital records', 'enterprise data management'],
    },
    {
      label: 'Data Modeling & ERD (1h 30m)',
      title: 'Data Modeling & ERD',
      focus: 'Definition of data modeling, characteristics of data models, functions of ERD, types of data models, entity analysis techniques, relationship mapping methods, cardinality determination, normalization principles, schema planning strategies, business rules identification, normal forms application, and project planning considerations',
      outcomes: ['define data modeling using comprehensive frameworks', 'analyze key characteristics of effective data models', 'evaluate different types of data models and their applications', 'explain the core functions of ERD in database design', 'build ER diagrams with proper entities and relationships', 'identify entities, attributes, and cardinalities correctly', 'apply normalization principles to schema design', 'map business rules to database constraints'],
      tools: ['ERD', 'entities', 'attributes', 'normalization', 'cardinality notation', 'relationship types', 'business rules', 'normal forms', 'schema planning tools'],
      concepts: ['entity identification', 'attribute classification', 'relationship mapping', 'cardinality rules', 'normalization theory', 'business rule constraints', 'schema optimization', 'project-specific modeling'],
      lab: 'Design an ERD for a school management system with students, courses, lecturers, and payments, including entity analysis, relationship mapping, and normalization.',
      applications: ['school systems', 'e-commerce apps', 'library platforms', 'enterprise database design'],
    },
    {
      label: 'SQL Basics & Advanced Queries (1h 30m)',
      title: 'SQL Basics & Advanced Queries',
      focus: 'Definition of SQL, characteristics of SQL queries, functions of SQL in data retrieval, types of SQL statements, data retrieval techniques, join operations and types, grouping and aggregation methods, subquery construction and usage, query writing best practices, practical and industry applications, result interpretation strategies, and advanced query optimization',
      outcomes: ['define SQL and its role in database systems', 'analyze characteristics of effective SQL queries', 'evaluate different types of SQL statements and their purposes', 'explain functions of SQL in data manipulation and retrieval', 'write SELECT queries with proper syntax', 'use joins, grouping, and subqueries effectively', 'interpret query results for business insights', 'apply advanced query techniques in real scenarios'],
      tools: ['SELECT', 'JOIN', 'GROUP BY', 'subqueries', 'WHERE clauses', 'ORDER BY', 'HAVING', 'aggregate functions', 'query optimization tools'],
      concepts: ['query structure', 'data projection', 'selection criteria', 'aggregation operations', 'nested queries', 'join algorithms', 'result interpretation', 'performance optimization'],
      lab: 'Write reports for sales, top customers, and low-stock products from a sample retail database, using basic and advanced SQL techniques.',
      applications: ['analytics dashboards', 'business reporting', 'operational monitoring', 'data analysis platforms'],
    },
    {
      label: 'Database Design Principles (1h)',
      title: 'Database Design Principles',
      focus: 'Definition of database design, Characteristics of quality schemas, Functions of design principles, Types of database designs, Key constraint selection, Naming discipline standards, Maintainable relational structures, Candidate key identification, Referential integrity rules, Surrogate key usage, Consistency enforcement, Schema evaluation criteria',
      outcomes: ['define database design principles comprehensively', 'analyze characteristics of high-quality database schemas', 'evaluate different types of database design approaches', 'explain functions of design principles in system development', 'select appropriate primary and foreign keys', 'apply consistent naming standards', 'evaluate and improve schema quality', 'implement referential integrity constraints'],
      tools: ['primary keys', 'foreign keys', 'constraints', 'schema conventions', 'naming standards', 'design evaluation tools', 'integrity checkers'],
      concepts: ['key selection', 'naming conventions', 'referential integrity', 'surrogate keys', 'schema consistency', 'design evaluation', 'maintainability principles'],
      lab: 'Refactor a poor schema into a cleaner, constraint-driven relational design, applying design principles and naming standards.',
      applications: ['enterprise databases', 'project systems', 'production schema reviews', 'database maintenance'],
    },
    {
      label: 'Indexing & Optimization (1h)',
      title: 'Indexing & Optimization',
      focus: 'Definition of indexing, Characteristics of index structures, Functions of indexing in performance, Types of indexes, Query performance analysis, Access path selection, Indexing tradeoffs evaluation, Execution planning strategies, B-tree index mechanics, Covering index concepts, Full scan scenarios, Selectivity calculations',
      outcomes: ['define indexing and its importance in databases', 'analyze characteristics of different index types', 'evaluate indexing tradeoffs and performance impacts', 'explain functions of indexing in query optimization', 'identify causes of slow queries', 'choose appropriate indexes for performance', 'understand index mechanics and selection criteria'],
      tools: ['indexes', 'query plans', 'search conditions', 'optimization', 'B-tree structures', 'covering indexes', 'selectivity calculators', 'performance monitors'],
      concepts: ['index benefits', 'query optimization', 'access paths', 'index tradeoffs', 'B-tree algorithms', 'covering queries', 'selectivity metrics', 'performance baselines'],
      lab: 'Measure query timing before and after adding indexes to a transaction table, analyzing performance improvements and tradeoffs.',
      applications: ['large apps', 'search-heavy systems', 'transaction platforms', 'performance-critical databases'],
    },
    {
      label: 'Transactions & Concurrency (1h)',
      title: 'Transactions & Concurrency',
      focus: 'Definition of transactions, Characteristics of transaction properties, Functions of ACID principles, Types of transaction models, Concurrency control mechanisms, Locking strategies and types, Isolation level configurations, Rollback and recovery processes, Concurrent user safety, Dirty read prevention, Lost update avoidance, Serializability concepts',
      outcomes: ['define transactions and their properties', 'analyze characteristics of ACID principles', 'evaluate different concurrency control approaches', 'explain functions of transactions in data integrity', 'identify concurrency issues and solutions', 'apply appropriate isolation levels', 'understand transaction boundaries and recovery'],
      tools: ['transactions', 'locks', 'commit', 'rollback', 'isolation levels', 'concurrency controls', 'serialization tools'],
      concepts: ['ACID properties', 'concurrency problems', 'locking mechanisms', 'isolation levels', 'transaction recovery', 'serializability', 'consistency maintenance'],
      lab: 'Simulate concurrent account transfers and inspect consistency failures, implementing proper transaction controls.',
      applications: ['banking software', 'point-of-sale systems', 'reservation services', 'multi-user databases'],
    },
    {
      label: 'Stored Procedures & Views (1h)',
      title: 'Stored Procedures & Views',
      focus: 'Definition of stored procedures, Characteristics of server-side logic, Functions of reusable database interfaces, Types of stored procedures, View creation and usage, Controlled data exposure methods, Abstraction principles, Privilege boundary management, Query reuse strategies, Parameterized logic implementation, Security and performance benefits',
      outcomes: ['define stored procedures and views', 'analyze characteristics of server-side database logic', 'evaluate abstraction and reuse benefits', 'explain functions of stored procedures in data management', 'create and use database views effectively', 'implement parameterized and reusable logic', 'apply privilege boundaries and security controls'],
      tools: ['views', 'stored procedures', 'reusable queries', 'encapsulation', 'parameterization', 'privilege management', 'abstraction tools'],
      concepts: ['server-side logic', 'query abstraction', 'privilege boundaries', 'logic reuse', 'parameterized execution', 'data encapsulation', 'security controls'],
      lab: 'Create a reporting view and a reusable stored routine for a fee payment summary, demonstrating abstraction and reuse.',
      applications: ['reporting portals', 'ERP modules', 'admin dashboards', 'secure data access'],
    },
    {
      label: 'Database Security & Access Control (1h)',
      title: 'Database Security & Access Control',
      focus: 'Definition of database security, Characteristics of access control systems, Functions of authentication and authorization, Types of security models, User role management, Injection risk prevention, Least privilege implementation, Secure query practices, Audit logging strategies, Institutional data protection, Threat identification and mitigation',
      outcomes: ['define database security principles', 'analyze characteristics of access control systems', 'evaluate different security model types', 'explain functions of authentication and authorization', 'implement role-based access controls', 'prevent common injection vulnerabilities', 'apply least privilege principles', 'protect sensitive institutional data'],
      tools: ['roles', 'permissions', 'parameterized queries', 'audit logs', 'access controls', 'security policies', 'threat detection'],
      concepts: ['authentication', 'authorization', 'role-based access', 'least privilege', 'injection prevention', 'audit trails', 'data protection'],
      lab: 'Model role-based access for admin, lecturer, cashier, and student-facing users, implementing security controls.',
      applications: ['secure portals', 'financial systems', 'regulated data environments', 'enterprise security'],
    },
    {
      label: 'Distributed Databases & Replication (1h 30m)',
      title: 'Distributed Databases & Replication',
      focus: 'Definition of distributed databases, Characteristics of multi-node systems, Functions of replication mechanisms, Types of replication models, Consistency tradeoff analysis, High availability strategies, Leader-follower replication concepts, Partitioning techniques, Eventual consistency models, Failover procedures, Campus-wide deployment considerations',
      outcomes: ['define distributed database systems', 'analyze characteristics of multi-node architectures', 'evaluate replication model types and tradeoffs', 'explain functions of distributed databases in scalability', 'compare consistency and availability choices', 'understand partitioning and replication strategies', 'design distributed database deployments'],
      tools: ['replication', 'sharding', 'consistency', 'availability', 'partitioning tools', 'failover mechanisms', 'distributed monitoring'],
      concepts: ['multi-node storage', 'replication models', 'consistency tradeoffs', 'high availability', 'leader-follower patterns', 'data partitioning', 'failover strategies'],
      lab: 'Compare a centralized database design with a replicated campus-wide deployment model, analyzing tradeoffs and benefits.',
      applications: ['multi-branch businesses', 'cloud platforms', 'high-availability services', 'distributed enterprises'],
    },
    {
      label: 'Backup & Recovery (1h)',
      title: 'Backup & Recovery',
      focus: 'Definition of backup strategies, Characteristics of recovery processes, Functions of business continuity, Types of backup methods, Recovery objective planning, Fault response procedures, RPO and RTO concepts, Disaster recovery frameworks, Validation testing approaches, Incremental vs full backup comparisons, Restore workflow management',
      outcomes: ['define backup and recovery principles', 'analyze characteristics of effective backup strategies', 'evaluate different backup types and methods', 'explain functions of backup in business continuity', 'plan recovery workflows and objectives', 'implement disaster recovery procedures', 'validate backup and restore processes'],
      tools: ['full backup', 'incremental backup', 'restore', 'recovery', 'RPO calculators', 'RTO planners', 'validation tools'],
      concepts: ['business continuity', 'backup strategies', 'recovery objectives', 'disaster recovery', 'validation testing', 'fault response', 'data protection'],
      lab: 'Plan and document a weekly backup and restore test process for a college database, including validation procedures.',
      applications: ['business continuity', 'IT operations', 'risk management', 'data protection services'],
    },
    {
      label: 'Database Administration & Monitoring (1h)',
      title: 'Database Administration & Monitoring',
      focus: 'Definition of database administration, Characteristics of operational maintenance, Functions of health monitoring, Types of capacity planning, Troubleshooting methodologies, Performance baseline establishment, Resource usage tracking, Incident response strategies, Maintenance window scheduling, Availability metric analysis, Capacity issue identification',
      outcomes: ['define database administration responsibilities', 'analyze characteristics of effective monitoring systems', 'evaluate capacity planning approaches', 'explain functions of DBA in system maintenance', 'establish performance baselines and metrics', 'identify and resolve capacity issues', 'plan maintenance tasks and incident responses'],
      tools: ['monitoring', 'logs', 'capacity planning', 'maintenance windows', 'performance baselines', 'resource trackers', 'incident response tools'],
      concepts: ['operational maintenance', 'health monitoring', 'capacity planning', 'troubleshooting', 'performance metrics', 'resource management', 'incident response'],
      lab: 'Review a mock production incident and propose monitoring metrics and DBA actions, including capacity planning.',
      applications: ['production support', 'managed services', 'operations teams', 'database maintenance'],
    },
  ],
  'Data Communications & Networks': [
    {
      label: 'Networking Fundamentals (1h)',
      title: 'Networking Fundamentals',
      focus: 'network concepts, topology, addressing, and communication basics used in real network design, deployment, and troubleshooting',
      outcomes: ['define network components', 'explain topologies', 'describe network communication flow'],
      tools: ['hosts', 'switches', 'routers', 'media'],
      concepts: ['network scope', 'packet transfer', 'peer communication', 'topology choices'],
      lab: 'Draw and explain a simple campus LAN with switches, routers, clients, and servers.',
      applications: ['campus networks', 'office LANs', 'internet access'],
    },
    {
      label: 'TCP/IP & OSI Models (1h 30m)',
      title: 'TCP/IP & OSI Models',
      focus: 'layered communication models and how protocols map to real network services',
      outcomes: ['name OSI layers', 'map protocols to layers', 'trace packet movement across layers'],
      tools: ['OSI', 'TCP/IP', 'encapsulation', 'protocol stack'],
      concepts: ['layer mapping', 'framing', 'encapsulation', 'service abstraction'],
      lab: 'Trace a web request through each layer from browser to server and back.',
      applications: ['web communication', 'email delivery', 'network troubleshooting'],
    },
    {
      label: 'Routing & Switching (1h 30m)',
      title: 'Routing & Switching',
      focus: 'packet forwarding, MAC learning, subnetting, and network segmentation',
      outcomes: ['explain router vs switch roles', 'interpret forwarding decisions', 'apply subnetting basics'],
      tools: ['routing tables', 'MAC tables', 'subnets', 'VLANs'],
      concepts: ['broadcast domains', 'forwarding decisions', 'subnet masks', 'switching logic'],
      lab: 'Design a segmented network for administration, labs, library, and hostel services.',
      applications: ['enterprise LANs', 'department networks', 'building segmentation'],
    },
    {
      label: 'IP Addressing & Subnetting (1h 30m)',
      title: 'IP Addressing & Subnetting',
      focus: 'IPv4 planning, subnet calculation, host allocation, and efficient address design',
      outcomes: ['calculate subnets', 'assign hosts correctly', 'plan address spaces'],
      tools: ['IPv4', 'subnet masks', 'CIDR', 'host ranges'],
      concepts: ['network IDs', 'broadcast addresses', 'CIDR notation', 'address planning'],
      lab: 'Subnet a /24 network into separate academic, admin, and wireless segments.',
      applications: ['VLAN design', 'router setup', 'network planning'],
    },
    {
      label: 'Network Devices & Media (1h)',
      title: 'Network Devices & Media',
      focus: 'device roles, cabling media, transceivers, and selecting appropriate infrastructure',
      outcomes: ['identify device roles', 'choose media types', 'compare hardware capabilities'],
      tools: ['routers', 'switches', 'access points', 'fiber'],
      concepts: ['throughput', 'distance limits', 'device functions', 'physical constraints'],
      lab: 'Match device types and cable media to different campus deployment cases.',
      applications: ['lab setup', 'office installation', 'data center edge'],
    },
    {
      label: 'Network Security (1h)',
      title: 'Network Security',
      focus: 'threats, controls, firewalls, authentication, and secure network design',
      outcomes: ['identify common threats', 'describe access controls', 'explain defense-in-depth'],
      tools: ['firewalls', 'ACLs', 'IDS/IPS', 'authentication'],
      concepts: ['network attacks', 'segmentation', 'trust boundaries', 'monitoring'],
      lab: 'Draft a secure network policy for student labs, staff offices, and remote access.',
      applications: ['enterprise defense', 'school IT policy', 'remote access security'],
    },
    {
      label: 'Wireless & WAN Technologies (1h 30m)',
      title: 'Wireless & WAN Technologies',
      focus: 'wireless standards, WAN links, mobility, and enterprise connectivity choices',
      outcomes: ['compare WLAN and WAN uses', 'describe wireless challenges', 'identify enterprise connectivity options'],
      tools: ['Wi-Fi', 'WAN', 'latency', 'bandwidth'],
      concepts: ['coverage planning', 'wireless interference', 'ISP links', 'link characteristics'],
      lab: 'Plan a wireless deployment covering lecture halls, offices, and outdoor spaces.',
      applications: ['campus Wi-Fi', 'branch connectivity', 'hybrid office networking'],
    },
    {
      label: 'Network Services & Protocols (1h)',
      title: 'Network Services & Protocols',
      focus: 'supporting services such as DNS, DHCP, NAT, and service discovery in real networks',
      outcomes: ['explain DNS and DHCP', 'describe NAT roles', 'identify protocol dependencies'],
      tools: ['DNS', 'DHCP', 'NAT', 'ARP'],
      concepts: ['name resolution', 'address assignment', 'translation', 'protocol dependency'],
      lab: 'Map the services required for a new branch office to get clients online securely.',
      applications: ['client onboarding', 'internet access', 'service reliability'],
    },
    {
      label: 'Network Management & Troubleshooting (1h 30m)',
      title: 'Network Management & Troubleshooting',
      focus: 'diagnostics, monitoring, documentation, and layered troubleshooting workflow',
      outcomes: ['follow a troubleshooting process', 'interpret symptoms', 'document findings clearly'],
      tools: ['ping', 'traceroute', 'logs', 'monitoring dashboards'],
      concepts: ['fault isolation', 'symptom analysis', 'escalation', 'documentation'],
      lab: 'Troubleshoot a staged outage involving DNS, switching, and wrong subnet configuration.',
      applications: ['service desk support', 'network operations', 'field troubleshooting'],
    },
    {
      label: 'Network Design Project (1h)',
      title: 'Network Design Project',
      focus: 'bringing addressing, routing, security, and services together in one capstone design',
      outcomes: ['integrate prior modules', 'justify design decisions', 'present a workable topology'],
      tools: ['design diagrams', 'address plans', 'security zones', 'service maps'],
      concepts: ['end-to-end design', 'tradeoff analysis', 'documentation', 'implementation planning'],
      lab: 'Prepare a full proposal for a medium-sized organization network with diagrams and services.',
      applications: ['capstone projects', 'client proposals', 'deployment planning'],
    },
  ],
  'Distributed Systems': [
    {
      label: 'Distributed System Concepts (1h)',
      title: 'Distributed System Concepts',
      focus: 'the structure, purpose, and tradeoffs of systems spread across multiple machines',
      outcomes: ['define distributed systems', 'describe benefits and risks', 'relate the model to cloud platforms'],
      tools: ['nodes', 'messages', 'coordination', 'scalability'],
      concepts: ['decentralization', 'message passing', 'resource sharing', 'service coordination'],
      lab: 'Compare a monolithic deployment with a distributed deployment for an online portal.',
      applications: ['cloud services', 'campus systems', 'online platforms'],
    },
    {
      label: 'Consensus & Fault Tolerance (1h 30m)',
      title: 'Consensus & Fault Tolerance',
      focus: 'reliability, replication, leader election, and keeping services available under failure',
      outcomes: ['explain consensus goals', 'describe replication', 'identify fault-tolerance strategies'],
      tools: ['replication', 'consensus', 'failover', 'quorum'],
      concepts: ['agreement', 'fault detection', 'leader election', 'service continuity'],
      lab: 'Model how a distributed grade processing system survives node failure.',
      applications: ['reliable platforms', 'cloud databases', 'critical online services'],
    },
    {
      label: 'Microservices Architecture (1h)',
      title: 'Microservices Architecture',
      focus: 'service decomposition, APIs, independent deployment, and boundaries in modern systems',
      outcomes: ['define microservices', 'compare with monoliths', 'identify service boundaries'],
      tools: ['services', 'APIs', 'deployment', 'service contracts'],
      concepts: ['bounded contexts', 'service contracts', 'deployment independence', 'observability'],
      lab: 'Break a school ERP into admissions, finance, exams, and notification services.',
      applications: ['enterprise software', 'SaaS platforms', 'modular backends'],
    },
    {
      label: 'Scalability & Load Balancing (1h 30m)',
      title: 'Scalability & Load Balancing',
      focus: 'horizontal scaling, bottlenecks, load balancing, and system growth patterns',
      outcomes: ['compare vertical and horizontal scaling', 'identify bottlenecks', 'explain load-balancing behavior'],
      tools: ['scaling', 'load balancer', 'throughput', 'availability'],
      concepts: ['request distribution', 'hotspots', 'performance ceilings', 'elastic growth'],
      lab: 'Design a scaling plan for a student portal during registration week.',
      applications: ['high-traffic apps', 'cloud platforms', 'resource planning'],
    },
    {
      label: 'Distributed Communication Patterns (1h)',
      title: 'Distributed Communication Patterns',
      focus: 'request-response, messaging, event-driven integration, and asynchronous workflows',
      outcomes: ['compare sync and async calls', 'describe message patterns', 'choose suitable communication models'],
      tools: ['REST', 'queues', 'events', 'brokers'],
      concepts: ['coupling', 'latency', 'async processing', 'workflow coordination'],
      lab: 'Map order placement, payment, and notification steps using events and queues.',
      applications: ['e-commerce flows', 'notification systems', 'workflow engines'],
    },
    {
      label: 'Distributed Data Management (1h 30m)',
      title: 'Distributed Data Management',
      focus: 'replicated state, partitioned data, consistency models, and data ownership',
      outcomes: ['explain partitioning', 'describe data ownership', 'compare consistency models'],
      tools: ['partitioning', 'replication', 'consistency', 'data locality'],
      concepts: ['ownership boundaries', 'sync lag', 'eventual consistency', 'data placement'],
      lab: 'Design data ownership for users, billing, and activity logs across services.',
      applications: ['multi-region systems', 'analytics pipelines', 'large-scale products'],
    },
    {
      label: 'Cloud Infrastructure Basics (1h)',
      title: 'Cloud Infrastructure Basics',
      focus: 'compute, storage, networking, virtualization, and service provisioning in distributed environments',
      outcomes: ['explain cloud primitives', 'map services to workloads', 'describe infrastructure tradeoffs'],
      tools: ['VMs', 'containers', 'storage', 'virtual networks'],
      concepts: ['provisioning', 'elasticity', 'service models', 'resource pooling'],
      lab: 'Sketch an infrastructure plan for hosting a student information system in the cloud.',
      applications: ['cloud migration', 'hosting decisions', 'infrastructure planning'],
    },
    {
      label: 'Containerization & Orchestration (1h 30m)',
      title: 'Containerization & Orchestration',
      focus: 'container packaging, deployment consistency, scheduling, and orchestration at scale',
      outcomes: ['define containers', 'describe orchestration goals', 'compare VMs and containers'],
      tools: ['containers', 'images', 'orchestration', 'scheduling'],
      concepts: ['portability', 'resource isolation', 'service discovery', 'rollouts'],
      lab: 'Plan container deployment for three services with scaling and restart requirements.',
      applications: ['DevOps pipelines', 'modern deployment', 'cloud-native apps'],
    },
    {
      label: 'Observability & Monitoring (1h)',
      title: 'Observability & Monitoring',
      focus: 'metrics, logs, tracing, and diagnosing issues across many cooperating components',
      outcomes: ['differentiate logs, metrics, and traces', 'use observability for diagnosis', 'identify service health indicators'],
      tools: ['metrics', 'logs', 'traces', 'alerts'],
      concepts: ['telemetry', 'error budgets', 'latency tracking', 'incident response'],
      lab: 'Design a dashboard and alert set for a distributed learning platform.',
      applications: ['SRE practice', 'production support', 'incident management'],
    },
    {
      label: 'Distributed Systems Capstone (1h)',
      title: 'Distributed Systems Capstone',
      focus: 'integrating architecture, scaling, reliability, and operations into one end-to-end system design',
      outcomes: ['synthesize the module', 'justify architecture decisions', 'prepare a complete distributed design'],
      tools: ['architecture diagrams', 'service maps', 'deployment plans', 'operational controls'],
      concepts: ['tradeoff analysis', 'system design', 'operational readiness', 'scalable delivery'],
      lab: 'Produce a capstone design for a national e-learning platform with resilient services and operations.',
      applications: ['final projects', 'solution architecture', 'portfolio work'],
    },
  ],
  'Data Structures & Algorithms': [
    {
      label: 'Introduction to Data Structures (1h)',
      title: 'Introduction to Data Structures',
      focus: 'how data is organized in memory and why structure choice affects efficiency and maintainability',
      outcomes: ['define data structures', 'compare structure tradeoffs', 'connect data representation to performance'],
      tools: ['arrays', 'lists', 'memory', 'operations'],
      concepts: ['organization', 'access patterns', 'efficiency', 'representation'],
      lab: 'Compare how student records behave when stored in arrays versus linked structures.',
      applications: ['software systems', 'compiler internals', 'database engines'],
    },
    {
      label: 'Arrays & Linked Lists (1h 30m)',
      title: 'Arrays & Linked Lists',
      focus: 'linear data structures, indexing, insertion cost, and dynamic storage behavior',
      outcomes: ['explain array indexing', 'describe linked list behavior', 'choose between the two structures'],
      tools: ['arrays', 'linked lists', 'nodes', 'references'],
      concepts: ['sequential storage', 'dynamic links', 'insertion cost', 'memory tradeoffs'],
      lab: 'Implement insertion, deletion, and traversal for arrays and singly linked lists.',
      applications: ['record storage', 'buffers', 'low-level software'],
    },
    {
      label: 'Stacks & Queues (1h)',
      title: 'Stacks & Queues',
      focus: 'LIFO and FIFO processing models and how they support scheduling and expression evaluation',
      outcomes: ['differentiate stack and queue behavior', 'identify use cases', 'apply push/pop and enqueue/dequeue operations'],
      tools: ['stacks', 'queues', 'push', 'enqueue'],
      concepts: ['LIFO', 'FIFO', 'overflow', 'underflow'],
      lab: 'Build a call stack simulation and a print queue simulation.',
      applications: ['OS scheduling', 'parsing', 'task processing'],
    },
    {
      label: 'Trees & Binary Search Trees (1h 30m)',
      title: 'Trees & Binary Search Trees',
      focus: 'hierarchical structures, traversal strategies, and ordered search operations',
      outcomes: ['define tree terminology', 'perform traversals', 'explain BST search behavior'],
      tools: ['trees', 'BST', 'traversal', 'nodes'],
      concepts: ['root', 'subtree', 'height', 'ordering'],
      lab: 'Insert and search values in a binary search tree, then trace in-order traversal.',
      applications: ['file systems', 'indexing', 'expression parsing'],
    },
    {
      label: 'Heaps & Priority Queues (1h)',
      title: 'Heaps & Priority Queues',
      focus: 'priority-based retrieval, heap ordering, and efficient selection operations',
      outcomes: ['describe heap properties', 'compare min-heap and max-heap', 'use priority queues in problem solving'],
      tools: ['heaps', 'priority queues', 'heapify', 'ordering'],
      concepts: ['heap property', 'priority retrieval', 'partial ordering', 'selection'],
      lab: 'Model an emergency task scheduler using a priority queue.',
      applications: ['schedulers', 'graph algorithms', 'simulation systems'],
    },
    {
      label: 'Hash Tables & Dictionaries (1h)',
      title: 'Hash Tables & Dictionaries',
      focus: 'key-value access, hashing, collisions, and near-constant-time lookup',
      outcomes: ['explain hashing', 'describe collision handling', 'identify dictionary use cases'],
      tools: ['hash tables', 'hash functions', 'buckets', 'lookup'],
      concepts: ['collisions', 'load factor', 'distribution', 'key-value storage'],
      lab: 'Create a small dictionary implementation and test collision scenarios.',
      applications: ['caches', 'symbol tables', 'session stores'],
    },
    {
      label: 'Algorithm Analysis & Big O (1h 30m)',
      title: 'Algorithm Analysis & Big O',
      focus: 'time complexity, space complexity, and comparing algorithms using asymptotic reasoning',
      outcomes: ['define Big O notation', 'estimate growth rates', 'compare algorithm efficiency'],
      tools: ['Big O', 'complexity', 'growth rate', 'space usage'],
      concepts: ['best case', 'worst case', 'scalability', 'asymptotic analysis'],
      lab: 'Analyze common search and sort routines and compare their performance growth.',
      applications: ['software optimization', 'technical interviews', 'system design decisions'],
    },
    {
      label: 'Searching & Sorting Techniques (1h 30m)',
      title: 'Searching & Sorting Techniques',
      focus: 'classic search and sort algorithms and when each strategy is appropriate',
      outcomes: ['compare sorting algorithms', 'differentiate linear and binary search', 'match techniques to data conditions'],
      tools: ['binary search', 'merge sort', 'quick sort', 'selection sort'],
      concepts: ['comparison-based sorting', 'divide and conquer', 'ordered search', 'stability'],
      lab: 'Run search and sort experiments on ordered and unordered student datasets.',
      applications: ['search systems', 'data pipelines', 'performance tuning'],
    },
    {
      label: 'Recursion & Divide and Conquer (1h)',
      title: 'Recursion & Divide and Conquer',
      focus: 'recursive reasoning, base cases, and problem decomposition for efficient solutions',
      outcomes: ['trace recursive calls', 'define base cases', 'explain divide-and-conquer design'],
      tools: ['recursion', 'call stack', 'base case', 'divide and conquer'],
      concepts: ['self-reference', 'stack frames', 'termination', 'decomposition'],
      lab: 'Trace factorial, tree traversal, and merge sort recursion by hand and in code.',
      applications: ['tree algorithms', 'sorting', 'problem decomposition'],
    },
    {
      label: 'Graph Algorithms Fundamentals (1h 30m)',
      title: 'Graph Algorithms Fundamentals',
      focus: 'graph representation, traversal, shortest paths, and connectivity concepts',
      outcomes: ['represent graphs', 'perform BFS and DFS', 'identify graph problem patterns'],
      tools: ['graphs', 'BFS', 'DFS', 'adjacency lists'],
      concepts: ['vertices', 'edges', 'traversal', 'connectivity'],
      lab: 'Model a road network and run BFS/DFS traversal tasks.',
      applications: ['routing', 'social networks', 'dependency analysis'],
    },
  ],
  'Operating Systems': [
    {
      label: 'Introduction to Operating Systems (1h)',
      title: 'Introduction to Operating Systems',
      focus: 'the role of the operating system as a resource manager and interface between hardware and software',
      outcomes: ['define operating system functions', 'describe kernel responsibilities', 'relate OS roles to user programs'],
      tools: ['kernel', 'processes', 'resources', 'system calls'],
      concepts: ['resource management', 'abstraction', 'coordination', 'services'],
      lab: 'Map how an OS manages CPU, memory, storage, and peripherals in a simple workstation.',
      applications: ['desktop systems', 'servers', 'mobile devices'],
    },
    {
      label: 'Processes & Threads (1h 30m)',
      title: 'Processes & Threads',
      focus: 'execution units, concurrency, context switching, and lightweight threading',
      outcomes: ['differentiate processes and threads', 'explain context switching', 'identify concurrency benefits'],
      tools: ['processes', 'threads', 'context switch', 'scheduling'],
      concepts: ['isolation', 'shared state', 'parallelism', 'execution units'],
      lab: 'Trace process creation and thread scheduling for a multitasking scenario.',
      applications: ['web servers', 'desktop apps', 'background services'],
    },
    {
      label: 'CPU Scheduling (1h)',
      title: 'CPU Scheduling',
      focus: 'how the operating system allocates CPU time fairly and efficiently across tasks',
      outcomes: ['describe scheduling goals', 'compare algorithms', 'interpret turnaround and waiting time'],
      tools: ['FCFS', 'Round Robin', 'priority scheduling', 'time slice'],
      concepts: ['fairness', 'latency', 'throughput', 'responsiveness'],
      lab: 'Compute scheduling metrics for a set of processes using multiple algorithms.',
      applications: ['interactive systems', 'real-time workloads', 'multi-user systems'],
    },
    {
      label: 'Process Synchronization (1h 30m)',
      title: 'Process Synchronization',
      focus: 'critical sections, race conditions, semaphores, and safe coordination',
      outcomes: ['identify race conditions', 'explain critical sections', 'use synchronization primitives conceptually'],
      tools: ['mutexes', 'semaphores', 'critical sections', 'locks'],
      concepts: ['mutual exclusion', 'deadlock risk', 'coordination', 'shared resources'],
      lab: 'Analyze producer-consumer and dining philosophers synchronization problems.',
      applications: ['multithreaded software', 'database engines', 'device drivers'],
    },
    {
      label: 'Deadlocks & Resource Allocation (1h)',
      title: 'Deadlocks & Resource Allocation',
      focus: 'resource contention, deadlock conditions, avoidance, and recovery methods',
      outcomes: ['define deadlock conditions', 'recognize unsafe states', 'compare prevention and avoidance'],
      tools: ['resource graphs', 'Banker algorithm', 'allocation', 'deadlock recovery'],
      concepts: ['hold and wait', 'circular wait', 'safe state', 'contention'],
      lab: 'Model a deadlock scenario and propose prevention or recovery strategies.',
      applications: ['concurrent services', 'transaction systems', 'industrial control'],
    },
    {
      label: 'Memory Management (1h 30m)',
      title: 'Memory Management',
      focus: 'main memory allocation, fragmentation, paging, and efficient use of RAM',
      outcomes: ['explain memory allocation models', 'differentiate paging and segmentation', 'identify fragmentation effects'],
      tools: ['paging', 'segmentation', 'frames', 'virtual addresses'],
      concepts: ['allocation', 'fragmentation', 'address translation', 'memory protection'],
      lab: 'Trace how logical addresses map to physical memory using pages and frames.',
      applications: ['application performance', 'system stability', 'virtual memory systems'],
    },
    {
      label: 'Virtual Memory (1h)',
      title: 'Virtual Memory',
      focus: 'extending memory through disk-backed paging and page replacement policies',
      outcomes: ['define virtual memory', 'explain page faults', 'compare replacement strategies'],
      tools: ['page faults', 'LRU', 'FIFO', 'swap space'],
      concepts: ['working set', 'replacement policy', 'thrashing', 'illusion of large memory'],
      lab: 'Evaluate page replacement behavior on a sample reference string.',
      applications: ['general-purpose OSes', 'server workloads', 'resource-limited systems'],
    },
    {
      label: 'File Systems & Storage (1h 30m)',
      title: 'File Systems & Storage',
      focus: 'files, directories, allocation methods, and storage organization',
      outcomes: ['describe file system structures', 'explain allocation methods', 'compare storage strategies'],
      tools: ['inodes', 'directories', 'allocation', 'storage blocks'],
      concepts: ['metadata', 'hierarchy', 'allocation', 'persistence'],
      lab: 'Design a simple file hierarchy and analyze contiguous versus indexed allocation.',
      applications: ['operating system storage', 'backup systems', 'cloud storage layers'],
    },
    {
      label: 'Device Management & I/O (1h)',
      title: 'Device Management & I/O',
      focus: 'drivers, buffering, interrupts, and communication with hardware devices',
      outcomes: ['explain device drivers', 'describe interrupt handling', 'identify buffering use cases'],
      tools: ['interrupts', 'drivers', 'buffers', 'controllers'],
      concepts: ['I/O coordination', 'latency hiding', 'hardware abstraction', 'interrupt service'],
      lab: 'Trace how keyboard input and disk reads are handled by the operating system.',
      applications: ['embedded systems', 'desktop platforms', 'server hardware'],
    },
    {
      label: 'OS Security & Protection (1h)',
      title: 'OS Security & Protection',
      focus: 'user accounts, permissions, isolation, and operating system hardening',
      outcomes: ['describe protection mechanisms', 'explain permissions', 'recognize OS security risks'],
      tools: ['permissions', 'user accounts', 'protection rings', 'hardening'],
      concepts: ['isolation', 'access control', 'privilege separation', 'system integrity'],
      lab: 'Review a multi-user OS scenario and apply file and account protections.',
      applications: ['server hardening', 'enterprise desktops', 'multi-user platforms'],
    },
  ],
  'Software Engineering': [
    {
      label: 'Introduction to Software Engineering (1h)',
      title: 'Introduction to Software Engineering',
      focus: 'the disciplined development of software systems using engineering processes and quality standards',
      outcomes: ['define software engineering', 'describe why process matters', 'connect engineering practice to software quality'],
      tools: ['requirements', 'process', 'quality', 'lifecycle'],
      concepts: ['discipline', 'maintainability', 'teamwork', 'quality assurance'],
      lab: 'Analyze why a software project failed and map the missing engineering practices.',
      applications: ['enterprise apps', 'consulting projects', 'product teams'],
    },
    {
      label: 'Software Development Life Cycle (1h 30m)',
      title: 'Software Development Life Cycle',
      focus: 'phases of planning, analysis, design, implementation, testing, deployment, and maintenance',
      outcomes: ['name SDLC phases', 'explain their purpose', 'connect deliverables to project stages'],
      tools: ['analysis', 'design', 'implementation', 'maintenance'],
      concepts: ['lifecycle', 'deliverables', 'phase gates', 'traceability'],
      lab: 'Map a sample project to SDLC stages and expected outputs.',
      applications: ['client projects', 'internal tools', 'product releases'],
    },
    {
      label: 'Requirements Engineering (1h 30m)',
      title: 'Requirements Engineering',
      focus: 'eliciting, documenting, validating, and managing software requirements',
      outcomes: ['differentiate functional and non-functional requirements', 'capture stakeholder needs', 'reduce ambiguity'],
      tools: ['user stories', 'use cases', 'requirements specs', 'validation'],
      concepts: ['stakeholders', 'scope', 'constraints', 'acceptance criteria'],
      lab: 'Draft requirements for a student portal from stakeholder interviews.',
      applications: ['business systems', 'government systems', 'startup products'],
    },
    {
      label: 'Software Design & Architecture (1h 30m)',
      title: 'Software Design & Architecture',
      focus: 'structuring systems into components, layers, and maintainable interfaces',
      outcomes: ['describe architecture basics', 'identify components', 'evaluate modular design choices'],
      tools: ['architecture diagrams', 'components', 'interfaces', 'layers'],
      concepts: ['modularity', 'coupling', 'cohesion', 'separation of concerns'],
      lab: 'Create a layered design for a school fee management application.',
      applications: ['scalable apps', 'enterprise solutions', 'maintainable systems'],
    },
    {
      label: 'Agile & Project Management (1h)',
      title: 'Agile & Project Management',
      focus: 'iterative planning, teamwork, delivery tracking, and project coordination',
      outcomes: ['explain agile values', 'describe sprint planning', 'link management to delivery outcomes'],
      tools: ['sprints', 'backlogs', 'kanban', 'milestones'],
      concepts: ['iteration', 'feedback loops', 'planning', 'team coordination'],
      lab: 'Build a simple sprint backlog and release plan for a campus app.',
      applications: ['software teams', 'startup delivery', 'consulting engagements'],
    },
    {
      label: 'Version Control & Collaboration (1h)',
      title: 'Version Control & Collaboration',
      focus: 'source control, branching, merging, and team collaboration practices',
      outcomes: ['explain git workflows', 'describe branch usage', 'prevent common collaboration mistakes'],
      tools: ['git', 'branches', 'commits', 'pull requests'],
      concepts: ['history', 'branching', 'merge conflicts', 'collaboration'],
      lab: 'Simulate a small team workflow using feature branches and pull requests.',
      applications: ['team development', 'open source', 'release management'],
    },
    {
      label: 'Software Testing Fundamentals (1h 30m)',
      title: 'Software Testing Fundamentals',
      focus: 'test levels, defect detection, verification, and validation strategies',
      outcomes: ['differentiate unit and integration testing', 'explain validation', 'identify testing goals'],
      tools: ['unit tests', 'integration tests', 'test cases', 'assertions'],
      concepts: ['verification', 'validation', 'coverage', 'quality control'],
      lab: 'Write a basic test plan and sample unit tests for a calculator or login module.',
      applications: ['quality assurance', 'continuous delivery', 'reliable software'],
    },
    {
      label: 'Software Quality Assurance (1h)',
      title: 'Software Quality Assurance',
      focus: 'quality processes, reviews, standards, and defect prevention across the lifecycle',
      outcomes: ['describe QA activities', 'explain reviews and audits', 'link standards to quality improvement'],
      tools: ['reviews', 'quality metrics', 'standards', 'audits'],
      concepts: ['process quality', 'defect prevention', 'compliance', 'continuous improvement'],
      lab: 'Review a mini project against a quality checklist and propose improvements.',
      applications: ['regulated projects', 'enterprise delivery', 'testing organizations'],
    },
    {
      label: 'Maintenance & Evolution (1h)',
      title: 'Maintenance & Evolution',
      focus: 'keeping software useful through fixes, enhancements, refactoring, and adaptation',
      outcomes: ['define maintenance types', 'explain refactoring value', 'describe software evolution'],
      tools: ['refactoring', 'bug fixes', 'enhancements', 'technical debt'],
      concepts: ['corrective maintenance', 'adaptive maintenance', 'technical debt', 'code health'],
      lab: 'Review an aging codebase and classify needed maintenance actions.',
      applications: ['legacy systems', 'long-lived products', 'support contracts'],
    },
    {
      label: 'Software Engineering Capstone (1h)',
      title: 'Software Engineering Capstone',
      focus: 'integrating requirements, design, testing, delivery, and maintenance in a full project perspective',
      outcomes: ['synthesize prior topics', 'justify engineering choices', 'present a complete project workflow'],
      tools: ['project artifacts', 'plans', 'designs', 'test evidence'],
      concepts: ['end-to-end delivery', 'evidence of quality', 'team accountability', 'professional practice'],
      lab: 'Prepare a complete engineering proposal for a real software project from concept to maintenance.',
      applications: ['portfolio work', 'client proposals', 'final-year projects'],
    },
  ],
  'Web Development': [
    {
      label: 'Introduction to Web Development (1h)',
      title: 'Introduction to Web Development',
      focus: 'how the web works, browser-server interaction, and the main layers of web applications',
      outcomes: ['describe the web request cycle', 'differentiate frontend and backend roles', 'explain the browser-server model'],
      tools: ['browser', 'server', 'HTTP', 'URL'],
      concepts: ['request-response', 'rendering', 'resources', 'web architecture'],
      lab: 'Trace how a browser loads an HTML page with CSS and JavaScript assets.',
      applications: ['web apps', 'content platforms', 'business portals'],
    },
    {
      label: 'HTML & Semantic Structure (1h)',
      title: 'HTML & Semantic Structure',
      focus: 'document structure, semantic tags, accessibility basics, and content organization',
      outcomes: ['build semantic HTML', 'structure documents clearly', 'support accessible navigation'],
      tools: ['HTML', 'semantic tags', 'forms', 'headings'],
      concepts: ['structure', 'accessibility', 'semantics', 'document hierarchy'],
      lab: 'Create a semantic landing page for an academic department site.',
      applications: ['web pages', 'content systems', 'accessible interfaces'],
    },
    {
      label: 'CSS Layout & Responsive Design (1h 30m)',
      title: 'CSS Layout & Responsive Design',
      focus: 'styling, layout systems, responsiveness, and adaptation across devices',
      outcomes: ['use CSS layout tools', 'build responsive views', 'adapt content for multiple screens'],
      tools: ['CSS', 'Flexbox', 'Grid', 'media queries'],
      concepts: ['layout flow', 'responsiveness', 'spacing', 'visual hierarchy'],
      lab: 'Style a responsive dashboard that works on mobile and desktop.',
      applications: ['portfolios', 'client websites', 'web apps'],
    },
    {
      label: 'JavaScript Fundamentals (1h 30m)',
      title: 'JavaScript Fundamentals',
      focus: 'language basics, interactivity, DOM manipulation, and event-driven behavior',
      outcomes: ['write JavaScript logic', 'handle events', 'manipulate page content'],
      tools: ['JavaScript', 'DOM', 'events', 'functions'],
      concepts: ['variables', 'control flow', 'event handling', 'dynamic behavior'],
      lab: 'Build a small interactive page with validation and live updates.',
      applications: ['frontend apps', 'interactive pages', 'dynamic forms'],
    },
    {
      label: 'Frontend Framework Concepts (1h)',
      title: 'Frontend Framework Concepts',
      focus: 'component-based UI design, state, props, and frontend architecture ideas',
      outcomes: ['explain components', 'describe state-driven UI', 'identify framework benefits'],
      tools: ['components', 'state', 'props', 'routing'],
      concepts: ['reusability', 'composition', 'reactivity', 'UI architecture'],
      lab: 'Break a dashboard page into reusable UI components.',
      applications: ['single-page apps', 'admin panels', 'interactive platforms'],
    },
    {
      label: 'Backend Development Basics (1h 30m)',
      title: 'Backend Development Basics',
      focus: 'server logic, APIs, routing, data access, and business logic handling',
      outcomes: ['describe backend responsibilities', 'explain API routes', 'connect data to application behavior'],
      tools: ['APIs', 'routes', 'controllers', 'database access'],
      concepts: ['server processing', 'validation', 'business rules', 'data flow'],
      lab: 'Design simple API endpoints for users, services, and consultations.',
      applications: ['REST APIs', 'service backends', 'client-server apps'],
    },
    {
      label: 'Web Databases & Persistence (1h)',
      title: 'Web Databases & Persistence',
      focus: 'connecting web apps to databases and managing stored application state',
      outcomes: ['relate database design to web apps', 'explain persistence', 'identify common data patterns'],
      tools: ['ORMs', 'SQL', 'queries', 'persistence'],
      concepts: ['CRUD', 'schema mapping', 'storage', 'application state'],
      lab: 'Map a web form to database inserts and dashboard list retrieval.',
      applications: ['portals', 'dashboards', 'content management'],
    },
    {
      label: 'Authentication & Authorization (1h)',
      title: 'Authentication & Authorization',
      focus: 'identity verification, sessions, tokens, and role-based access in web systems',
      outcomes: ['differentiate authentication and authorization', 'explain session flow', 'identify role-based access rules'],
      tools: ['sessions', 'tokens', 'roles', 'permissions'],
      concepts: ['identity', 'access control', 'session lifecycle', 'user roles'],
      lab: 'Design login, owner-only dashboard access, and logout behavior for an app.',
      applications: ['secure dashboards', 'admin portals', 'multi-user platforms'],
    },
    {
      label: 'Deployment & Hosting (1h)',
      title: 'Deployment & Hosting',
      focus: 'publishing applications, environment configuration, and moving from local development to production',
      outcomes: ['describe deployment steps', 'explain environment variables', 'differentiate hosting roles'],
      tools: ['hosting', 'domains', 'builds', 'environment variables'],
      concepts: ['production deployment', 'configuration', 'hosting models', 'release flow'],
      lab: 'Outline a deployment plan for a frontend, backend, and database stack.',
      applications: ['cloud hosting', 'continuous delivery', 'production release'],
    },
    {
      label: 'Web Development Capstone (1h)',
      title: 'Web Development Capstone',
      focus: 'combining frontend, backend, data, security, and deployment into one complete web solution',
      outcomes: ['integrate prior modules', 'justify implementation choices', 'present a full-stack solution design'],
      tools: ['UI', 'API', 'database', 'deployment pipeline'],
      concepts: ['end-to-end systems', 'integration', 'user experience', 'delivery'],
      lab: 'Prepare a complete design for a departmental services portal from UI to deployment.',
      applications: ['portfolio projects', 'client sites', 'startup MVPs'],
    },
  ],
  'Computer Security': [
    {
      label: 'Introduction to Computer Security (1h)',
      title: 'Introduction to Computer Security',
      focus: 'security goals, threats, vulnerabilities, and the importance of protecting systems and information',
      outcomes: ['define security basics', 'identify common threats', 'explain why protection matters'],
      tools: ['CIA triad', 'threats', 'vulnerabilities', 'controls'],
      concepts: ['confidentiality', 'integrity', 'availability', 'risk'],
      lab: 'Analyze a simple breach scenario and identify the violated security goals.',
      applications: ['enterprise IT', 'web platforms', 'personal computing'],
    },
    {
      label: 'Cryptography Fundamentals (1h 30m)',
      title: 'Cryptography Fundamentals',
      focus: 'encryption, hashing, keys, and secure communication foundations',
      outcomes: ['differentiate encryption and hashing', 'describe symmetric and asymmetric models', 'relate crypto to security services'],
      tools: ['encryption', 'hashing', 'keys', 'certificates'],
      concepts: ['confidentiality', 'integrity checks', 'key exchange', 'digital signatures'],
      lab: 'Compare hashing and encryption use cases in password storage and secure messaging.',
      applications: ['HTTPS', 'password storage', 'digital trust'],
    },
    {
      label: 'Authentication & Access Control (1h)',
      title: 'Authentication & Access Control',
      focus: 'identity, login controls, user roles, and access governance',
      outcomes: ['explain authentication factors', 'describe access models', 'identify privilege control needs'],
      tools: ['MFA', 'RBAC', 'permissions', 'identity'],
      concepts: ['identity assurance', 'least privilege', 'authorization', 'accountability'],
      lab: 'Design account and permission rules for a university management platform.',
      applications: ['enterprise login systems', 'admin panels', 'cloud accounts'],
    },
    {
      label: 'Network Security Principles (1h 30m)',
      title: 'Network Security Principles',
      focus: 'defending network boundaries, traffic, and services from attack',
      outcomes: ['identify network threats', 'describe protective controls', 'link policy to defense'],
      tools: ['firewalls', 'IDS/IPS', 'segmentation', 'VPN'],
      concepts: ['perimeter defense', 'traffic inspection', 'segmentation', 'secure channels'],
      lab: 'Plan controls for a campus network with labs, offices, and remote users.',
      applications: ['enterprise networks', 'branch offices', 'remote access'],
    },
    {
      label: 'Web Application Security (1h 30m)',
      title: 'Web Application Security',
      focus: 'common web vulnerabilities and secure development practices',
      outcomes: ['recognize common web attacks', 'explain secure coding practices', 'link input handling to security'],
      tools: ['validation', 'sanitization', 'sessions', 'OWASP'],
      concepts: ['injection', 'XSS', 'session security', 'secure coding'],
      lab: 'Review a login and form flow for injection and session-related weaknesses.',
      applications: ['web platforms', 'e-commerce', 'client portals'],
    },
    {
      label: 'System Hardening & Endpoint Security (1h)',
      title: 'System Hardening & Endpoint Security',
      focus: 'reducing attack surfaces on hosts, devices, and operating environments',
      outcomes: ['describe hardening steps', 'identify insecure defaults', 'explain endpoint protection'],
      tools: ['patching', 'antivirus', 'configuration baselines', 'hardening'],
      concepts: ['attack surface', 'patch hygiene', 'baseline configuration', 'defense'],
      lab: 'Create a hardening checklist for a Windows or Linux workstation.',
      applications: ['enterprise endpoints', 'server maintenance', 'lab environments'],
    },
    {
      label: 'Security Monitoring & Incident Response (1h 30m)',
      title: 'Security Monitoring & Incident Response',
      focus: 'logs, alerts, detection, triage, and coordinated response to security incidents',
      outcomes: ['describe monitoring goals', 'explain incident stages', 'identify response actions'],
      tools: ['logs', 'alerts', 'SIEM', 'incident handling'],
      concepts: ['detection', 'triage', 'containment', 'recovery'],
      lab: 'Walk through an incident response plan for a compromised account or malware alert.',
      applications: ['SOC workflows', 'enterprise response', 'managed security services'],
    },
    {
      label: 'Digital Forensics Basics (1h)',
      title: 'Digital Forensics Basics',
      focus: 'preserving, collecting, and examining digital evidence responsibly',
      outcomes: ['define digital evidence', 'explain preservation needs', 'recognize basic forensic workflow'],
      tools: ['evidence', 'chain of custody', 'imaging', 'analysis'],
      concepts: ['preservation', 'integrity', 'documentation', 'investigation'],
      lab: 'Outline how to preserve evidence from a compromised workstation.',
      applications: ['incident investigation', 'compliance review', 'legal support'],
    },
    {
      label: 'Security Policy, Risk & Governance (1h)',
      title: 'Security Policy, Risk & Governance',
      focus: 'managing security through policies, risk assessment, and governance structures',
      outcomes: ['describe security policy roles', 'explain basic risk treatment', 'connect governance to security practice'],
      tools: ['policy', 'risk assessment', 'controls', 'governance'],
      concepts: ['risk management', 'compliance', 'policy enforcement', 'oversight'],
      lab: 'Draft a short acceptable use and password policy for an institution.',
      applications: ['organizational governance', 'audits', 'security programs'],
    },
    {
      label: 'Computer Security Capstone (1h)',
      title: 'Computer Security Capstone',
      focus: 'integrating preventive, detective, and corrective controls in a full security scenario',
      outcomes: ['synthesize prior topics', 'justify layered defense choices', 'present a basic security plan'],
      tools: ['security layers', 'controls', 'response plans', 'governance'],
      concepts: ['defense in depth', 'risk-driven design', 'resilience', 'accountability'],
      lab: 'Prepare a basic security architecture and response plan for a digital services platform.',
      applications: ['security proposals', 'capstone work', 'real-world readiness'],
    },
  ],
};

type CourseProfile = {
  overview: string;
  foundations: string[];
  components: string[];
  workflows: string[];
  methods: string[];
  designConcerns: string[];
  troubleshooting: string[];
  applications: string[];
};

function joinList(items: string[], limit = items.length): string {
  const values = items.filter(Boolean).slice(0, limit);
  if (!values.length) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

const GENERIC_COURSE_PROFILES: Record<string, CourseProfile> = {
  'Computer Systems': {
    overview: 'how hardware, software, storage, users, and services work together as one complete computing environment',
    foundations: ['system purpose', 'component interaction', 'resource coordination'],
    components: ['CPU', 'memory', 'storage', 'operating system', 'input and output devices'],
    workflows: ['boot process', 'data processing flow', 'resource sharing'],
    methods: ['system mapping', 'component comparison', 'performance observation'],
    designConcerns: ['reliability', 'interoperability', 'capacity planning'],
    troubleshooting: ['fault isolation', 'resource bottlenecks', 'configuration analysis'],
    applications: ['desktop support', 'enterprise workstations', 'lab environments'],
  },
  'Computer Architecture': {
    overview: 'how processors, memory, buses, and control logic work together to execute instructions and move data efficiently',
    foundations: ['instruction execution', 'hardware organization', 'performance tradeoffs'],
    components: ['ALU', 'control unit', 'registers', 'cache', 'memory hierarchy'],
    workflows: ['fetch-decode-execute cycle', 'data movement', 'interrupt handling'],
    methods: ['instruction tracing', 'block-diagram reading', 'performance comparison'],
    designConcerns: ['latency', 'throughput', 'resource coordination'],
    troubleshooting: ['bottleneck analysis', 'timing issues', 'hardware behavior review'],
    applications: ['processor design', 'embedded systems', 'system optimization'],
  },
  'System Analysis & Design': {
    overview: 'how requirements are discovered, analyzed, modeled, and translated into workable system designs',
    foundations: ['problem definition', 'stakeholder needs', 'solution planning'],
    components: ['requirements', 'process models', 'data models', 'interfaces', 'design specifications'],
    workflows: ['requirements gathering', 'analysis modeling', 'design validation'],
    methods: ['use cases', 'data flow diagrams', 'UML modeling'],
    designConcerns: ['scope control', 'traceability', 'usability'],
    troubleshooting: ['requirement gaps', 'process mismatches', 'design defects'],
    applications: ['business systems', 'service platforms', 'project delivery'],
  },
  'Digital Electronics': {
    overview: 'how digital signals, logic gates, and sequential circuits produce reliable machine behavior',
    foundations: ['binary logic', 'signal behavior', 'circuit timing'],
    components: ['logic gates', 'flip-flops', 'registers', 'counters', 'combinational circuits'],
    workflows: ['signal evaluation', 'state transitions', 'timing analysis'],
    methods: ['truth tables', 'Boolean simplification', 'circuit simulation'],
    designConcerns: ['propagation delay', 'stability', 'timing accuracy'],
    troubleshooting: ['logic faults', 'wiring issues', 'unstable outputs'],
    applications: ['embedded controllers', 'processor logic', 'digital control systems'],
  },
  'Programming Fundamentals': {
    overview: 'how programs represent data, make decisions, repeat logic, and solve problems step by step',
    foundations: ['algorithmic thinking', 'control flow', 'data handling'],
    components: ['variables', 'data types', 'conditions', 'loops', 'functions'],
    workflows: ['input-process-output flow', 'debugging cycle', 'stepwise refinement'],
    methods: ['pseudocode', 'dry runs', 'incremental testing'],
    designConcerns: ['correctness', 'readability', 'efficiency'],
    troubleshooting: ['syntax errors', 'logic bugs', 'edge cases'],
    applications: ['automation scripts', 'software development', 'problem solving'],
  },
  'Web-Based Programming': {
    overview: 'how browsers, servers, page structure, styling, and scripts combine to deliver interactive web experiences',
    foundations: ['request-response flow', 'client-side behavior', 'server-side integration'],
    components: ['HTML', 'CSS', 'JavaScript', 'forms', 'APIs'],
    workflows: ['page rendering', 'event handling', 'data exchange'],
    methods: ['interface building', 'API integration', 'debugging with browser tools'],
    designConcerns: ['responsiveness', 'accessibility', 'performance'],
    troubleshooting: ['layout defects', 'script errors', 'integration failures'],
    applications: ['web portals', 'business sites', 'interactive applications'],
  },
  'OO Analysis & Design': {
    overview: 'how objects, responsibilities, and relationships are modeled before code is written',
    foundations: ['abstraction', 'responsibility assignment', 'object collaboration'],
    components: ['objects', 'classes', 'relationships', 'use cases', 'design models'],
    workflows: ['use-case discovery', 'class modeling', 'design refinement'],
    methods: ['UML diagrams', 'CRC cards', 'responsibility-driven design'],
    designConcerns: ['cohesion', 'coupling', 'extensibility'],
    troubleshooting: ['weak abstractions', 'dependency issues', 'model inconsistencies'],
    applications: ['modular software', 'enterprise systems', 'reusable designs'],
  },
  'OO Programming': {
    overview: 'how object-oriented designs become working classes, interfaces, and reusable behavior in code',
    foundations: ['encapsulation', 'inheritance', 'polymorphism'],
    components: ['classes', 'objects', 'methods', 'interfaces', 'constructors'],
    workflows: ['class design', 'object interaction', 'behavior reuse'],
    methods: ['refactoring', 'unit testing', 'composition'],
    designConcerns: ['maintainability', 'clarity', 'reuse'],
    troubleshooting: ['state bugs', 'inheritance misuse', 'design smells'],
    applications: ['desktop apps', 'backend services', 'business systems'],
  },
  'Software System Project': {
    overview: 'how planning, implementation, testing, documentation, and delivery come together in one software project',
    foundations: ['project structure', 'delivery planning', 'quality control'],
    components: ['requirements', 'tasks', 'codebase', 'tests', 'documentation'],
    workflows: ['planning cycle', 'implementation flow', 'review and release'],
    methods: ['task breakdown', 'version control', 'demo-based review'],
    designConcerns: ['scope management', 'quality assurance', 'team coordination'],
    troubleshooting: ['blockers', 'defect handling', 'delivery risks'],
    applications: ['client projects', 'team delivery', 'portfolio systems'],
  },
  'E-Systems & E-Commerce': {
    overview: 'how digital platforms support product discovery, transactions, fulfillment, and customer interaction',
    foundations: ['online transaction flow', 'digital trust', 'service integration'],
    components: ['catalog', 'cart', 'checkout', 'payments', 'customer accounts'],
    workflows: ['browse-to-purchase flow', 'order handling', 'service support'],
    methods: ['checkout analysis', 'platform integration', 'conversion review'],
    designConcerns: ['usability', 'transaction reliability', 'trust'],
    troubleshooting: ['payment failures', 'cart abandonment', 'integration issues'],
    applications: ['online stores', 'booking platforms', 'digital service businesses'],
  },
  'Techno-Entrepreneurship': {
    overview: 'how technical ideas are validated, shaped into products, and grown into viable ventures',
    foundations: ['problem validation', 'value creation', 'product-market fit'],
    components: ['customer segment', 'value proposition', 'MVP', 'pricing', 'operations'],
    workflows: ['idea validation', 'customer discovery', 'product iteration'],
    methods: ['market research', 'lean experiments', 'pitch design'],
    designConcerns: ['feasibility', 'scalability', 'differentiation'],
    troubleshooting: ['weak positioning', 'poor fit', 'pricing mistakes'],
    applications: ['startups', 'innovation labs', 'product launches'],
  },
  'Business Management': {
    overview: 'how planning, organization, leadership, finance, and operations shape effective business performance',
    foundations: ['planning', 'coordination', 'performance control'],
    components: ['strategy', 'staffing', 'budgeting', 'operations', 'leadership'],
    workflows: ['decision-making flow', 'resource allocation', 'performance review'],
    methods: ['SWOT analysis', 'KPI tracking', 'process improvement'],
    designConcerns: ['efficiency', 'accountability', 'sustainability'],
    troubleshooting: ['coordination issues', 'resource waste', 'performance gaps'],
    applications: ['service organizations', 'small businesses', 'operations management'],
  },
  'Research Methods in CS': {
    overview: 'how computing questions are investigated using clear problem statements, evidence, and structured analysis',
    foundations: ['research framing', 'evidence gathering', 'method selection'],
    components: ['problem statement', 'literature review', 'methodology', 'data', 'findings'],
    workflows: ['topic definition', 'data collection', 'analysis and reporting'],
    methods: ['surveys', 'experiments', 'interviews', 'evaluation studies'],
    designConcerns: ['validity', 'reliability', 'ethics'],
    troubleshooting: ['weak scope', 'bias', 'poor evidence quality'],
    applications: ['project studies', 'product evaluation', 'technical investigations'],
  },
  'Seminar & Report Writing': {
    overview: 'how technical ideas are organized into clear reports, presentations, and evidence-driven arguments',
    foundations: ['structure', 'clarity', 'evidence use'],
    components: ['outline', 'sections', 'citations', 'visuals', 'delivery'],
    workflows: ['research synthesis', 'drafting', 'editing and presentation'],
    methods: ['outlining', 'referencing', 'revision', 'presentation practice'],
    designConcerns: ['flow', 'credibility', 'readability'],
    troubleshooting: ['weak arguments', 'unsupported claims', 'poor formatting'],
    applications: ['project reports', 'seminars', 'technical proposals'],
  },
};

function getCourseProfile(course: string): CourseProfile {
  return (
    GENERIC_COURSE_PROFILES[course] || {
      overview: `the core ideas, moving parts, and practical use of ${course.toLowerCase()}`,
      foundations: ['core principles', 'structured reasoning', 'real-world behavior'],
      components: ['key elements', 'supporting components', 'working flow', 'tradeoffs'],
      workflows: ['analysis flow', 'implementation path', 'review cycle'],
      methods: ['guided explanation', 'comparison', 'applied practice'],
      designConcerns: ['clarity', 'reliability', 'maintainability'],
      troubleshooting: ['error analysis', 'bottleneck detection', 'decision review'],
      applications: ['real systems', 'project work', 'professional delivery'],
    }
  );
}

function createProfiledGenericSession(course: string, label: string, index: number, profile: CourseProfile): CurriculumSession {
  const sessionTitle = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const [foundationA, foundationB, foundationC] = profile.foundations;
  const [componentA, componentB, componentC, componentD, componentE = componentA] = profile.components;
  const [workflowA, workflowB, workflowC] = profile.workflows;
  const [methodA, methodB, methodC] = profile.methods;
  const [designA, designB, designC] = profile.designConcerns;
  const [troubleA, troubleB, troubleC] = profile.troubleshooting;
  const [appA, appB, appC] = profile.applications;

  const stagePlans = [
    {
      focus: `${profile.overview}. This opening session introduces ${joinList([componentA, componentB, componentC])}, the role of ${joinList([workflowA, workflowB])}, and the reasons these ideas matter in practice`,
      outcomes: [
        `describe the scope and purpose of ${course}`,
        `identify the main elements behind ${sessionTitle}`,
        `explain how ${joinList([workflowA, workflowB], 2)} influence real outcomes`,
      ],
      tools: [componentA, componentB, workflowA, methodA],
      concepts: [foundationA, workflowA, designA, appA],
      lab: `Create a guided walkthrough showing how ${joinList([componentA, componentB], 2)} interact during ${workflowA}.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `the principles that support ${course.toLowerCase()}, especially ${joinList([foundationA, foundationB, foundationC])}, and how they shape stable, understandable solutions`,
      outcomes: [
        `explain the foundational principles behind ${sessionTitle}`,
        `connect ${joinList([foundationA, foundationB], 2)} to system behavior`,
        `use those principles to reason about practical decisions`,
      ],
      tools: [foundationA, foundationB, methodA, designA],
      concepts: [foundationC, workflowB, designB, appA],
      lab: `Break down a practical scenario and explain which foundational principles drive the result and why.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `the major building blocks of ${course.toLowerCase()}, including ${joinList([componentA, componentB, componentC, componentD])}, and the way those parts depend on one another`,
      outcomes: [
        `identify the core components inside ${sessionTitle}`,
        `explain the job performed by ${joinList([componentA, componentB], 2)}`,
        `relate component-level behavior to the performance of the full system`,
      ],
      tools: [componentA, componentB, componentC, componentD],
      concepts: [workflowA, designA, troubleA, appA],
      lab: `Draw or document the main components involved in ${sessionTitle} and explain how information or control moves between them.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `the structural decisions behind ${course.toLowerCase()}, with emphasis on ${joinList([designA, designB, designC])}, the arrangement of ${joinList([componentA, componentB, componentE])}, and the tradeoffs that follow`,
      outcomes: [
        `explain how architecture choices shape ${course.toLowerCase()} behavior`,
        `compare two design approaches using clear technical criteria`,
        `justify design decisions in terms of ${joinList([designA, designB], 2)}`,
      ],
      tools: [componentA, componentE, designA, designB],
      concepts: [workflowB, workflowC, troubleA, appB],
      lab: `Prepare a design review showing why one architecture choice is stronger than another for a specific scenario.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `the techniques used to work effectively with ${course.toLowerCase()}, especially ${joinList([methodA, methodB, methodC])}, and how those approaches improve accuracy and understanding`,
      outcomes: [
        `use practical techniques to study or apply ${sessionTitle}`,
        `select suitable methods for explanation, analysis, and comparison`,
        `improve technical reasoning through structured practice`,
      ],
      tools: [methodA, methodB, methodC, workflowA],
      concepts: [designA, troubleA, appA, appB],
      lab: `Apply ${joinList([methodA, methodB], 2)} to a focused problem and explain what each method reveals.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `putting ${course.toLowerCase()} ideas into action by turning concepts such as ${joinList([workflowA, workflowB, componentA])} into practical steps, working results, or demonstrations`,
      outcomes: [
        `apply ${sessionTitle} ideas in a realistic implementation task`,
        `translate theory into clear working steps`,
        `evaluate whether the implementation behaves as expected`,
      ],
      tools: [workflowA, workflowB, componentA, methodA],
      concepts: [designB, troubleA, appA, appC],
      lab: `Build, document, or simulate a small implementation task that demonstrates the key ideas in ${sessionTitle}.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `examining how ${course.toLowerCase()} behaves under problems or stress, including ${joinList([troubleA, troubleB, troubleC])}, and how disciplined analysis leads to better fixes`,
      outcomes: [
        `diagnose common issues related to ${sessionTitle}`,
        `trace causes using evidence instead of guesswork`,
        `recommend practical corrective actions`,
      ],
      tools: [troubleA, troubleB, workflowA, methodB],
      concepts: [designA, designC, workflowC, appB],
      lab: `Analyze a fault scenario and document the symptoms, likely causes, and best corrective response.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `the practices that protect and strengthen ${course.toLowerCase()}, especially ${joinList([designA, designB, troubleA])}, consistency, and long-term quality`,
      outcomes: [
        `identify the best practices that improve ${sessionTitle}`,
        `explain why preventive thinking matters before problems appear`,
        `connect quality habits to safer and more dependable outcomes`,
      ],
      tools: [designA, designB, troubleA, methodC],
      concepts: [designC, troubleB, workflowB, appC],
      lab: `Create a best-practice checklist for ${sessionTitle} and justify each item with a clear technical reason.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `how ${course.toLowerCase()} is used in real situations, using case studies that highlight ${joinList([appA, appB, appC])}, common constraints, and practical decision-making`,
      outcomes: [
        `connect ${sessionTitle} to real-world scenarios`,
        `analyze case studies using the vocabulary of the topic`,
        `draw lessons that can guide future implementation work`,
      ],
      tools: [appA, appB, appC, methodA],
      concepts: [workflowA, designA, troubleA, foundationA],
      lab: `Review a case study and explain which ideas from ${sessionTitle} had the greatest impact on the final outcome.`,
      applications: [appA, appB, appC],
    },
    {
      focus: `bringing the full ${course.toLowerCase()} track together by reviewing the most important concepts, methods, decisions, and real-use patterns across the earlier sessions`,
      outcomes: [
        `synthesize the major ideas covered across ${course}`,
        `explain how the main concepts connect instead of treating them separately`,
        `prepare confidently for deeper practice, review, and final assessment`,
      ],
      tools: [foundationA, componentA, workflowA, methodA],
      concepts: [designA, troubleA, appA, appB],
      lab: `Prepare a capstone-style review that ties together the key concepts, working steps, and real uses from the full course.`,
      applications: [appA, appB, appC],
    },
  ];

  const plan = stagePlans[index] || stagePlans[0];

  return {
    label,
    title: sessionTitle,
    focus: plan.focus,
    outcomes: plan.outcomes,
    tools: plan.tools,
    concepts: plan.concepts,
    lab: plan.lab,
    applications: plan.applications,
  };
}

const APPLICATION_IMPACTS = [
  'performance, predictability, and decision quality',
  'reliability, maintainability, and long-term stability',
  'resource efficiency, observability, and troubleshooting speed',
  'security, control, and resilience under stress',
];

const ANALYSIS_LENSES = [
  'what the system is optimizing',
  'where the main bottleneck or weakness is likely to appear',
  'which tradeoff is being made between speed, simplicity, reliability, or control',
  'how a small design choice can change the final outcome',
];

function buildKeyTermDetails(session: CurriculumSession, limit = 6): string[] {
  return session.tools.slice(0, limit).map((tool, index) => {
    const concept = session.concepts[index % session.concepts.length] || session.title.toLowerCase();
    const outcome = session.outcomes[index % session.outcomes.length] || `explain ${session.title}`;
    const application = session.applications[index % session.applications.length] || 'real technical work';
    return `${tool} matters in ${session.title} because it gives you a precise way to reason about ${concept}; in ${application}, it helps you ${outcome}.`;
  });
}

function buildConceptDetails(session: CurriculumSession, limit = 6): string[] {
  return session.concepts.slice(0, limit).map((concept, index) => {
    const tool = session.tools[index % session.tools.length] || session.title;
    const lens = ANALYSIS_LENSES[index % ANALYSIS_LENSES.length];
    return `${concept} is a core idea in ${session.title} because it shapes how you interpret ${tool}, evaluate ${lens}, and justify technical choices.`;
  });
}

function buildApplicationDetails(session: CurriculumSession): string[] {
  return session.applications.slice(0, 3).map((application, index) => {
    const concepts = joinList(session.concepts.slice(index, index + 2), 2) || session.title.toLowerCase();
    const impact = APPLICATION_IMPACTS[index % APPLICATION_IMPACTS.length];
    return `In ${application}, ${session.title} influences ${impact} because ideas such as ${concepts} affect how solutions are designed, reviewed, and improved.`;
  });
}

function buildAnalysisPrompts(session: CurriculumSession): string[] {
  return [
    `When reviewing ${session.title}, ask ${ANALYSIS_LENSES[0]} and how ${joinList(session.tools.slice(0, 2), 2)} contribute to it.`,
    `Trace where ${joinList(session.concepts.slice(0, 2), 2)} create benefits, delays, risks, or hidden constraints in a real scenario.`,
    `Compare two plausible approaches and explain which one better supports ${joinList(session.applications.slice(0, 2), 2)} and why.`,
  ];
}

function buildProcessFlow(session: CurriculumSession): LessonInsightCard[] {
  const toolA = session.tools[0] || session.title;
  const toolB = session.tools[1] || session.tools[0] || session.title;
  const conceptA = session.concepts[0] || session.title.toLowerCase();
  const conceptB = session.concepts[1] || conceptA;
  const application = session.applications[0] || 'real systems';

  return [
    {
      title: '1. Starting Point',
      detail: `Begin with the objective of ${session.title} and identify the role of ${toolA}. This creates the baseline for every later explanation and decision.`,
    },
    {
      title: '2. Core Interaction',
      detail: `Trace how ${toolA} works with ${toolB}, and connect that interaction to ${conceptA} so the topic becomes a working model rather than a definition list.`,
    },
    {
      title: '3. Decision Point',
      detail: `Evaluate where ${conceptB} introduces a tradeoff. Ask what is gained, what is constrained, and which choice best supports the intended result.`,
    },
    {
      title: '4. Practical Effect',
      detail: `Carry the explanation into ${application} and describe how the decision changes performance, reliability, maintainability, control, or user impact.`,
    },
    {
      title: '5. Review Loop',
      detail: `Stress-test your explanation under failure, scale, timing pressure, or changing requirements; if it no longer holds, refine the model and defend the revision.`,
    },
  ];
}

function buildDecisionFrames(session: CurriculumSession): LessonInsightCard[] {
  const toolA = session.tools[0] || session.title;
  const conceptA = session.concepts[0] || session.title.toLowerCase();
  const conceptB = session.concepts[1] || conceptA;
  const applicationA = session.applications[0] || 'real systems';
  const applicationB = session.applications[1] || applicationA;

  return [
    {
      title: 'Performance vs Control',
      detail: `${session.title} often forces a balance between raw speed and clear control. In ${applicationA}, a faster path can reduce the time or visibility needed to inspect what is happening.`,
    },
    {
      title: 'Simplicity vs Flexibility',
      detail: `A simpler explanation of ${toolA} may be easier to learn, but stronger systems usually need the flexibility to handle ${conceptA} and ${conceptB} under different conditions.`,
    },
    {
      title: 'Short-Term Fix vs Long-Term Design',
      detail: `A quick adjustment can solve an immediate issue, but a stronger design asks how ${session.title} will behave over time, especially in ${applicationB}.`,
    },
    {
      title: 'Local Choice vs System Consequence',
      detail: `What looks like a small change in one component can create larger consequences for coordination, timing, observability, or maintenance across the whole system.`,
    },
  ];
}

function buildScenarioSnapshots(session: CurriculumSession): LessonInsightCard[] {
  return session.applications.slice(0, 3).map((application, index) => {
    const concepts = joinList(session.concepts.slice(index, index + 2), 2) || session.title.toLowerCase();
    const tool = session.tools[index % session.tools.length] || session.title;
    return {
      title: `Scenario: ${application}`,
      detail: `In ${application}, teams rely on ${session.title} to reason about ${concepts}. A weak understanding of ${tool} can lead to poor decisions, hidden bottlenecks, or misleading explanations.`,
    };
  });
}

function buildCommonPitfalls(session: CurriculumSession): string[] {
  return [
    `Treating ${session.title} as a list of definitions instead of a model of interacting parts and consequences.`,
    `Using ${session.tools[0] || session.title} without relating it to ${session.concepts[0] || 'the wider system'} and the actual technical objective.`,
    `Explaining the final result without tracing the steps, dependencies, and constraints that produced it.`,
    `Ignoring how the topic behaves differently under scale, failure, timing pressure, or limited resources.`,
  ];
}

function buildFailureSignals(session: CurriculumSession): string[] {
  return [
    `The explanation of ${joinList(session.tools.slice(0, 2), 2)} is unclear, inconsistent, or disconnected from real behavior.`,
    `Decisions are made without discussing tradeoffs such as speed, reliability, maintainability, control, or observability.`,
    `The topic is applied mechanically in ${session.applications[0] || 'real work'} without checking whether the assumptions still hold.`,
    `Symptoms are described, but root causes tied to ${joinList(session.concepts.slice(0, 2), 2)} are never identified.`,
  ];
}

function buildDeepDiveQuestions(session: CurriculumSession): string[] {
  return [
    `If one key assumption changed, which part of ${session.title} would fail first, and why?`,
    `Which tradeoff in ${session.title} matters most in ${session.applications[0] || 'this scenario'}, and how would you defend your decision?`,
    `What evidence would convince you that your explanation of ${session.title} is correct rather than merely plausible?`,
    `How would you teach ${session.title} using one real system, one failure case, and one design decision?`,
  ];
}

function buildVisualExplainers(session: CurriculumSession): LessonVisualExplainer[] {
  const mapItems = [...session.tools, ...session.concepts].slice(0, 4);
  const flowItems = [
    session.tools[0],
    session.concepts[0],
    session.concepts[1] || session.tools[1],
    session.applications[0],
  ].filter(Boolean) as string[];

  return [
    {
      title: 'Visual Concept Map',
      caption: `Use this map to see how the central topic connects to its most important parts before you dive into the detailed explanation.`,
      variant: 'system',
      primary: session.title,
      items: mapItems,
      highlights: session.concepts.slice(0, 3),
    },
    {
      title: 'Process Flow Diagram',
      caption: `Read this flow from left to right to understand how the topic moves from building blocks to practical effect.`,
      variant: 'flow',
      primary: session.title,
      items: flowItems,
      highlights: session.outcomes.slice(0, 3),
    },
    {
      title: 'Application Impact View',
      caption: `This visual links the topic to real environments where design choices, constraints, and outcomes become visible.`,
      variant: 'application',
      primary: session.title,
      items: session.applications.slice(0, 3),
      highlights: session.outcomes.slice(0, 3),
    },
  ];
}

function buildFallbackVisualExplainers(courseTitle: string, sessionTitle: string): LessonVisualExplainer[] {
  return [
    {
      title: 'Visual Concept Map',
      caption: `A quick image-first way to see the main parts that support ${sessionTitle}.`,
      variant: 'system',
      primary: sessionTitle,
      items: [courseTitle, 'core ideas', 'workflow', 'tradeoffs'],
      highlights: ['structure', 'reasoning', 'application'],
    },
    {
      title: 'Process Flow Diagram',
      caption: `This flow helps you move from topic definition to practical explanation and justified decisions.`,
      variant: 'flow',
      primary: sessionTitle,
      items: ['goal', 'parts', 'tradeoff', 'result'],
      highlights: ['explain clearly', 'compare options', 'justify decisions'],
    },
    {
      title: 'Application Impact View',
      caption: `See how the lesson transfers into implementation, troubleshooting, and design work.`,
      variant: 'application',
      primary: sessionTitle,
      items: ['implementation', 'troubleshooting', 'design review'],
      highlights: ['clarity', 'control', 'technical judgment'],
    },
  ];
}

function wrapSvgText(text: string, maxChars = 18): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 4);
}

type SvgTextProps = {
  text: string;
  x: number;
  y: number;
  maxChars?: number;
  lineHeight?: number;
  anchor?: 'start' | 'middle' | 'end';
  className?: string;
};

function SvgTextBlock({ text, x, y, maxChars = 18, lineHeight = 18, anchor = 'middle', className }: SvgTextProps) {
  const lines = wrapSvgText(text, maxChars);
  return (
    <text x={x} y={y} textAnchor={anchor} className={className}>
      {lines.map((line, index) => (
        <tspan key={`${text}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function LessonVisualGraphic({ explainer }: { explainer: LessonVisualExplainer }) {
  if (explainer.variant === 'system') {
    return (
      <svg viewBox="0 0 640 360" className="h-full w-full">
        <defs>
          <linearGradient id="systemGlow" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="640" height="360" rx="26" fill="#0d1b31" />
        <circle cx="320" cy="180" r="150" fill="url(#systemGlow)" />
        <rect x="210" y="130" width="220" height="100" rx="24" fill="#13233b" stroke="#22d3ee" strokeOpacity="0.45" />
        <SvgTextBlock text={explainer.primary} x={320} y={170} maxChars={20} lineHeight={20} className="fill-white text-[18px] font-semibold" />
        {explainer.items.map((item, index) => {
          const positions = [
            { x: 80, y: 70 },
            { x: 470, y: 70 },
            { x: 80, y: 250 },
            { x: 470, y: 250 },
          ];
          const pos = positions[index] || positions[0];
          return (
            <g key={item}>
              <line
                x1={pos.x + 80}
                y1={pos.y + 35}
                x2={320}
                y2={180}
                stroke="#60a5fa"
                strokeOpacity="0.45"
                strokeWidth="2"
              />
              <rect x={pos.x} y={pos.y} width="160" height="70" rx="18" fill="#10233c" stroke="#7c3aed" strokeOpacity="0.35" />
              <SvgTextBlock text={item} x={pos.x + 80} y={pos.y + 30} maxChars={16} lineHeight={16} className="fill-[#e2e8f0] text-[14px] font-medium" />
            </g>
          );
        })}
      </svg>
    );
  }

  if (explainer.variant === 'flow') {
    return (
      <svg viewBox="0 0 640 360" className="h-full w-full">
        <rect x="0" y="0" width="640" height="360" rx="26" fill="#0d1b31" />
        <text x="48" y="52" className="fill-[#67e8f9] text-[18px] font-semibold">
          {explainer.primary}
        </text>
        {explainer.items.map((item, index) => {
          const x = 42 + index * 146;
          return (
            <g key={item}>
              <rect x={x} y="118" width="116" height="86" rx="20" fill="#13233b" stroke="#22d3ee" strokeOpacity="0.3" />
              <SvgTextBlock text={item} x={x + 58} y={146} maxChars={14} lineHeight={16} className="fill-white text-[14px] font-medium" />
              {index < explainer.items.length - 1 ? (
                <>
                  <line x1={x + 116} y1="161" x2={x + 136} y2="161" stroke="#38bdf8" strokeWidth="3" strokeOpacity="0.8" />
                  <polyline points={`${x + 130},154 ${x + 138},161 ${x + 130},168`} fill="none" stroke="#38bdf8" strokeWidth="3" strokeOpacity="0.8" />
                </>
              ) : null}
            </g>
          );
        })}
        <rect x="40" y="244" width="560" height="78" rx="20" fill="#10233c" stroke="#f59e0b" strokeOpacity="0.25" />
        <SvgTextBlock
          text={joinList(explainer.highlights, 3)}
          x={320}
          y={278}
          maxChars={52}
          lineHeight={18}
          className="fill-[#f8fafc] text-[14px]"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 640 360" className="h-full w-full">
      <rect x="0" y="0" width="640" height="360" rx="26" fill="#0d1b31" />
      <circle cx="138" cy="180" r="74" fill="#13233b" stroke="#22d3ee" strokeOpacity="0.4" />
      <SvgTextBlock text={explainer.primary} x={138} y={168} maxChars={15} lineHeight={18} className="fill-white text-[16px] font-semibold" />
      {explainer.items.map((item, index) => {
        const positions = [
          { x: 290, y: 68 },
          { x: 290, y: 150 },
          { x: 290, y: 232 },
        ];
        const pos = positions[index] || positions[0];
        return (
          <g key={item}>
            <line x1="212" y1="180" x2={pos.x} y2={pos.y + 32} stroke="#818cf8" strokeWidth="2.5" strokeOpacity="0.55" />
            <rect x={pos.x} y={pos.y} width="250" height="64" rx="18" fill="#13233b" stroke="#818cf8" strokeOpacity="0.35" />
            <SvgTextBlock text={item} x={pos.x + 125} y={pos.y + 28} maxChars={22} lineHeight={16} className="fill-[#e2e8f0] text-[14px] font-medium" />
          </g>
        );
      })}
      <rect x="36" y="298" width="568" height="38" rx="14" fill="#10233c" stroke="#22c55e" strokeOpacity="0.25" />
      <SvgTextBlock
        text={joinList(explainer.highlights, 3)}
        x={320}
        y={322}
        maxChars={58}
        lineHeight={18}
        className="fill-[#f8fafc] text-[13px]"
      />
    </svg>
  );
}

function buildSessionProgressionContext(session: CurriculumSession) {
  const sequence = session.sequence || 1;
  const trackLength = session.trackLength || 10;
  const stageLabel =
    sequence === 1
      ? 'orientation'
      : sequence <= 3
        ? 'foundation-building'
        : sequence <= 6
          ? 'system-building'
          : sequence <= 8
            ? 'analysis-and-control'
            : 'integration-and-mastery';

  const priorTopicBridge =
    sequence > 1
      ? `Because this is Topic ${sequence} of ${trackLength}, it should broaden the learner's view beyond the earlier session and connect prior ideas to ${joinList(session.concepts, 3)}.`
      : `Because this is Topic ${sequence} of ${trackLength}, it establishes the vocabulary, baseline mental model, and expectations that later sessions will keep expanding.`;

  const breadthExpectation =
    sequence > 1
      ? `You should study ${session.title} as a wider layer of the course hierarchy, where earlier knowledge is assumed and the discussion moves toward interaction, tradeoffs, constraints, and deeper real-world reasoning.`
      : `You should study ${session.title} as the entry layer of the hierarchy, focusing on scope, vocabulary, and the first working mental model for the course.`;

  const integrationPrompt =
    sequence >= Math.ceil(trackLength / 2)
      ? `At this stage of the track, strong answers should connect design choices, implementation behavior, troubleshooting evidence, and practical outcomes in one explanation.`
      : `At this stage of the track, strong answers should connect foundational concepts to system behavior and explain why later decisions depend on them.`;

  return {
    sequence,
    trackLength,
    stageLabel,
    priorTopicBridge,
    breadthExpectation,
    integrationPrompt,
  };
}

function createLessonFromCurriculum(session: CurriculumSession): LessonData {
  const isITSupportLesson = session.label.includes('IT Support & Customer Care');
  const progression = buildSessionProgressionContext(session);
  const keyTermDetails = buildKeyTermDetails(session);
  const visualExplainers = buildVisualExplainers(session);
  const conceptDetails = buildConceptDetails(session);
  const applicationDetails = buildApplicationDetails(session);
  const analysisPrompts = buildAnalysisPrompts(session);
  const processFlow = buildProcessFlow(session);
  const decisionFrames = buildDecisionFrames(session);
  const scenarioSnapshots = buildScenarioSnapshots(session);
  const commonPitfalls = buildCommonPitfalls(session);
  const failureSignals = buildFailureSignals(session);
  const deepDiveQuestions = buildDeepDiveQuestions(session);
  const notes = isITSupportLesson
    ? [
        `${session.title} focuses on ${session.focus}.`,
        `You will use this topic to ${session.outcomes[0]}, ${session.outcomes[1]}, and ${session.outcomes[2]}.`,
        `Key tools and terms in this topic include ${session.tools.join(', ')}.`,
        `Core smaller topics include ${session.concepts.join(', ')}.`,
        `Practice activity: ${session.lab}`,
        `Common real-world uses include ${session.applications.join(', ')}.`,
      ]
    : [
        `${session.title} explains ${session.focus}.`,
        `A strong understanding of this topic depends on seeing how ${joinList(session.concepts, 3)} shape real technical behavior and practical decisions.`,
        `As you study, pay attention to ${joinList(session.tools, 3)} because they give you the vocabulary needed to explain what the system is doing and why it matters.`,
        progression.priorTopicBridge,
        `By the end of this lesson, you should be able to ${session.outcomes[0]}, ${session.outcomes[1]}, and ${session.outcomes[2]}.`,
        `Practice focus: ${session.lab}`,
        `You will see these ideas again in ${joinList(session.applications, 3)}, where clear reasoning and good design choices directly affect the outcome.`,
        `The deeper skill in ${session.title} is not memorizing definitions, but explaining what changes when one component, constraint, or design choice shifts.`,
        progression.integrationPrompt,
      ];

  const learningObjectives = isITSupportLesson
    ? [
        `Explain what ${session.title} means in practical support work.`,
        `Describe the key smaller topics inside ${session.title}.`,
        `Apply ${session.title} ideas to user support situations.`,
      ]
    : [
        `Explain how the main parts of ${session.title} work together.`,
        `Describe the most important concepts, tradeoffs, and technical terms inside ${session.title}.`,
        `Apply ${session.title} to design choices, troubleshooting steps, or implementation work.`,
        `Discuss ${session.title} clearly using precise technical language and examples.`,
        `Show how Topic ${progression.sequence} expands the course hierarchy beyond the earlier lessons instead of repeating the introductory layer.`,
      ];

  const sections = isITSupportLesson
    ? [
        {
          title: 'Smaller Topic 1: Topic Overview',
          subtopics: [
            {
              title: 'Main Idea',
              content: [
                `${session.title} focuses on ${session.focus}.`,
                `This topic gives the learner a practical support perspective instead of theory alone.`,
              ],
            },
            {
              title: 'Expected Outcome',
              content: session.outcomes.slice(0, 2).map((outcome) => `By the end of this topic you should be able to ${outcome}.`),
            },
          ],
        },
        {
          title: 'Smaller Topic 2: Key Support Areas',
          subtopics: [
            {
              title: 'Tools and Terms',
              content: session.tools.map((tool) => `${tool} is a key term used in this topic.`),
            },
            {
              title: 'Subtopics',
              content: session.concepts.map((concept) => `${concept} is one of the smaller topics under ${session.title}.`),
            },
          ],
        },
        {
          title: 'Smaller Topic 3: Practice and Real Use',
          subtopics: [
            {
              title: 'Practice Task',
              content: [session.lab],
            },
            {
              title: 'Where It Is Used',
              content: session.applications.map((application) => `${session.title} is useful in ${application}.`),
            },
          ],
        },
      ]
    : [
        {
          title: 'Topic Overview',
          subtopics: [
            {
              title: 'Session Focus',
              content: [
                `${session.title} centers on ${session.focus}.`,
                `The goal is to move beyond naming parts and toward understanding how those parts behave, interact, and create tradeoffs in real situations.`,
                `As you read, keep asking how the topic changes system behavior, design choices, and the way engineers explain technical results.`,
                progression.breadthExpectation,
              ],
            },
            {
              title: 'Why It Matters',
              content: [
                `${session.title} matters because it influences how systems are designed, evaluated, optimized, and explained.`,
                `When you understand the topic well, you can justify technical decisions instead of relying on guesswork or memorized definitions.`,
                progression.integrationPrompt,
              ],
            },
            {
              title: 'Technical Lens',
              content: [
                `A useful way to study ${session.title} is to trace cause and effect: what inputs matter, what process happens next, and what output or consequence follows.`,
                `This lens helps you connect isolated concepts into one working model instead of treating each idea as a separate fact.`,
                `In the course hierarchy, Topic ${progression.sequence} sits in the ${progression.stageLabel} stage, so explanations should show how this lesson broadens the earlier understanding rather than restating it.`,
              ],
            },
          ],
        },
        {
          title: 'Core Concepts',
          subtopics: [
            {
              title: 'Key Study Terms',
              content: keyTermDetails,
            },
            {
              title: 'Subtopic Breakdown',
              content: conceptDetails,
            },
            {
              title: 'Decision Impact',
              content: [
                `The concepts in ${session.title} affect how you judge speed, reliability, maintainability, scalability, and control.`,
                `If you can explain which concept is driving a decision, you are much closer to true mastery than if you only remember the definition.`,
              ],
            },
          ],
        },
        {
          title: 'Practice & Application',
          subtopics: [
            {
              title: 'Laboratory Exercise',
              content: [
                session.lab,
                `A strong answer should explain not just what to do, but why each step improves understanding of the topic.`,
                `Go one level deeper by explaining what could go wrong, what tradeoff appears, and how you would defend your choices.`,
                `If this is Topic ${progression.sequence}, the practice should feel broader than the previous topic by combining earlier ideas with the new concepts introduced here.`,
              ],
            },
            {
              title: 'Real-World Relevance',
              content: applicationDetails,
            },
            {
              title: 'Analysis Lens',
              content: analysisPrompts,
            },
          ],
        },
      ];

  const summaryPoints = isITSupportLesson
    ? [
        `${session.title} is an important part of the full IT support and customer care learning path.`,
        `The topic connects ${session.concepts.slice(0, 3).join(', ')} to practical support work.`,
        `You should be ready to explain the topic clearly before moving to the quiz.`,
      ]
    : [
        `${session.title} is about understanding how ${joinList(session.concepts, 3)} work together in real technical situations.`,
        `The key terms in this lesson give you the language needed to explain behavior, compare options, and justify decisions.`,
        `You should now be ready to ${session.outcomes[0]}, ${session.outcomes[1]}, and ${session.outcomes[2]}.`,
        `Before progressing, make sure you can explain the topic in your own words and connect it to at least one real use case.`,
        `The strongest answers in this topic are the ones that connect a concept, a technical consequence, and a justified decision in one clear explanation.`,
        `Topic ${progression.sequence} should now feel broader than the earlier lesson because it extends the hierarchy into ${progression.stageLabel} reasoning and application.`,
      ];

  const qaQuestions = isITSupportLesson
    ? [
        {
          q: `What is the main focus of ${session.title}?`,
          options: [
            session.focus,
            'Avoiding users and customer communication',
            'Skipping practical support work',
            'Removing all need for documentation',
          ],
          correct: 0,
        },
        {
          q: `Which outcome matches ${session.title}?`,
          options: [
            'Ignoring the service workflow',
            session.outcomes[1],
            'Working without communication',
            'Avoiding user support completely',
          ],
          correct: 1,
        },
      ]
    : [
        {
          q: `What is the primary focus of ${session.title}?`,
          options: [
            session.focus,
            'Only memorizing terms without application',
            'Avoiding practical work completely',
            'Replacing every other module in the curriculum',
          ],
          correct: 0,
        },
        {
          q: `Which outcome is expected from ${session.title}?`,
          options: [
            'Ignoring implementation details',
            session.outcomes[1],
            'Skipping assessment tasks',
            'Removing the need for foundational knowledge',
          ],
          correct: 1,
        },
        {
          q: `Which practical task best fits ${session.title}?`,
          options: [
            session.lab,
            'Avoiding all practice and technical analysis',
            'Replacing the whole curriculum with one topic',
            'Studying unrelated office work only',
          ],
          correct: 0,
        },
        {
          q: `Which area is strongly connected to ${session.title}?`,
          options: [
            'Unrelated non-technical duties only',
            session.applications[1],
            'Ignoring systems and users',
            'Eliminating all analysis and design',
          ],
          correct: 1,
        },
      ];

  const quizQuestions = isITSupportLesson
    ? [
        {
          q: `Which set best belongs to ${session.title}?`,
          options: [
            session.tools.join(', '),
            'Payroll, accounting, and taxation',
            'Fashion design and modeling',
            'Cargo tracking and customs clearance',
          ],
          correct: 0,
        },
        {
          q: `Why does ${session.title} matter in an IT support course?`,
          options: [
            'It builds practical support and customer care ability',
            'It removes the need for future topics',
            'It avoids real service work',
            'It replaces all technical communication',
          ],
          correct: 0,
        },
        {
          q: `What is the best way to study ${session.title}?`,
          options: [
            'Connect the topic to real user support situations',
            'Read the title only',
            'Skip the smaller topics',
            'Ignore the practice activity',
          ],
          correct: 0,
        },
      ]
    : [
        {
          q: `Which set contains concepts central to ${session.title}?`,
          options: [
            session.tools.join(', '),
            'Payroll, accounting, and taxation only',
            'Graphic design and illustration only',
            'Unrelated office stationery terms',
          ],
          correct: 0,
        },
        {
          q: 'Why is this session important in the course?',
          options: [
            'To build strong technical understanding and practical reasoning',
            'To delay progress without learning value',
            'To remove the need for future modules',
            'To avoid assessment and review',
          ],
          correct: 0,
        },
        {
          q: 'What is the best approach while studying this lesson?',
          options: [
            'Connect each concept to system behavior, projects, and real technical scenarios',
            'Read only the title and leave',
            'Skip all questions and feedback',
            'Treat all topics as unrelated facts',
          ],
          correct: 0,
        },
        {
          q: `Which phrase best reflects the learning style for ${session.title}?`,
          options: [
            'Concepts, practice, and applied reasoning should work together',
            'Memorization alone is enough for mastery',
            'This session should be isolated from other units',
            'There is no need to link the topic to projects',
          ],
          correct: 0,
        },
        {
          q: `Why is ${session.title} important in this course?`,
          options: [
            'It supports technical understanding, implementation, and sound problem-solving',
            'It avoids all technical decisions',
            'It removes the need for future study',
            'It focuses only on unrelated business routines',
          ],
          correct: 0,
        },
      ];

  return {
    title: session.title,
    notes,
    learningObjectives,
    sections,
    keyTerms: [...session.tools, ...session.concepts].slice(0, 8),
    keyTermDetails,
    visualExplainers,
    background: [
      `${session.title} gives you the mental model needed to understand how ${joinList([session.concepts[0], session.concepts[1], session.concepts[2]].filter(Boolean))} influence real technical work.`,
      `Before going deeper, recall what you already know about ${joinList([session.tools[0], session.tools[1], session.concepts[0]].filter(Boolean))}.`,
      `As you study, look for cause-and-effect relationships: what changes, what stays stable, and what tradeoffs appear when the topic is applied.`,
      `A deeper reading of ${session.title} asks not only what each part does, but how the entire system behaves when those parts interact under load, failure, or changing requirements.`,
      progression.priorTopicBridge,
    ],
    analysisPrompts,
    processFlow,
    decisionFrames,
    scenarioSnapshots,
    commonPitfalls,
    failureSignals,
    deepDiveQuestions,
    workedExample: [
      `Scenario: a team needs to use ${session.title} while building, reviewing, or improving a solution used in ${session.applications[0]}.`,
      `Step 1: identify the real objective and isolate the concepts that matter most, especially ${joinList(session.concepts, 2)}.`,
      `Step 2: use ${joinList(session.tools, 2)} to explain what is happening, where the risk or opportunity appears, and what choice should be made.`,
      `Step 3: test the decision against tradeoffs such as speed, cost, reliability, maintainability, or security before accepting it.`,
      `Step 4: justify the result by linking it to performance, reliability, maintainability, security, or user impact in the final system.`,
      `Step 5: explain how this Topic ${progression.sequence} decision goes beyond the earlier lesson and broadens the course hierarchy into a more complex system view.`,
    ],
    practiceTasks: [
      session.lab,
      `Write a short explanation showing how ${joinList(session.concepts, 2)} affect the success of a real implementation.`,
      `Compare two practical situations and explain how ${session.title} changes the decisions you would make in each one.`,
      `Choose one design or troubleshooting choice related to ${session.title} and defend it against a realistic alternative.`,
    ],
    summaryPoints,
    shortTestTips: [
      `Review ${joinList(session.tools, 3)} until you can explain each term in plain technical language.`,
      `Be ready to describe how ${joinList(session.concepts, 2)} influence behavior, design choices, or troubleshooting steps.`,
      `Use the practice task and worked example to prepare for application-based questions instead of memorizing isolated definitions.`,
      `Push your revision one step further by explaining not only what happens, but why that behavior matters in a real system.`,
      `Check that your answer sounds broader than Topic ${Math.max(1, progression.sequence - 1)} by linking this lesson to the bigger system hierarchy and the next decisions it unlocks.`,
    ],
    qaQuestions,
    quizQuestions,
  };
}

const lessonContent: Record<string, Record<string, LessonData>> = Object.fromEntries(
  Object.entries(curriculumTracks).map(([course, sessions]) => [
    course,
    Object.fromEntries(sessions.map((session) => [session.label, createLessonFromCurriculum(session)])),
  ]),
);

function buildGenericTrackSessions(course: string) {
  return [
    `Introduction to ${course} (1h)`,
    `${course} Foundations (1h 30m)`,
    `${course} Core Components (1h 30m)`,
    `${course} Design & Architecture (1h 30m)`,
    `${course} Methods & Techniques (1h)`,
    `${course} Implementation Practice (1h 30m)`,
    `${course} Analysis & Troubleshooting (1h)`,
    `${course} Security & Best Practices (1h)`,
    `${course} Applications & Case Studies (1h 30m)`,
    `${course} Capstone Review (1h)`,
  ];
}

function buildGenericTrack(course: string): CurriculumSession[] {
  const profile = getCourseProfile(course);
  return buildGenericTrackSessions(course).map((label, index) => createProfiledGenericSession(course, label, index, profile));
}

function resolveTrackSessions(course: string): CurriculumSession[] {
  const sessions = curriculumTracks[course] || buildGenericTrack(course);
  return sessions.map((session, index) => ({
    ...session,
    sequence: index + 1,
    trackLength: sessions.length,
  }));
}

function buildFallbackLesson(course: string, session: string): LessonData {
  const sessionTitle = session.replace(/\s*\([^)]*\)\s*$/, '').trim() || 'Lesson Session';
  const courseTitle = course || 'Learning Track';
  const keyTermDetails = [
    `${courseTitle} is the broader technical space that gives meaning to ${sessionTitle}.`,
    `${sessionTitle} should be studied as a working topic, not just a label, so focus on behavior, tradeoffs, and practical consequences.`,
    `Analysis helps you break the topic into decisions, causes, and effects instead of memorizing isolated facts.`,
    `Implementation shows whether your explanation can survive contact with a real task or scenario.`,
  ];
  const analysisPrompts = [
    `Ask what the topic is optimizing, protecting, or making easier to understand.`,
    `Identify which decision would change if one assumption, resource limit, or system requirement shifted.`,
    `Explain the topic using one concrete scenario instead of staying at definition level.`,
  ];
  const visualExplainers = buildFallbackVisualExplainers(courseTitle, sessionTitle);
  const processFlow: LessonInsightCard[] = [
    {
      title: '1. Clarify the Goal',
      detail: `Start ${sessionTitle} by defining the problem, the system context, and the technical objective that the topic is supposed to support.`,
    },
    {
      title: '2. Trace the Moving Parts',
      detail: `Identify the parts, workflows, or decisions that interact, and explain how one element changes the behavior of the others.`,
    },
    {
      title: '3. Test the Tradeoff',
      detail: `Ask what is gained, what is constrained, and which option is stronger when time, complexity, risk, or scale changes.`,
    },
    {
      title: '4. Apply in Practice',
      detail: `Move the explanation into a real implementation, design review, or troubleshooting case and check whether the reasoning still holds.`,
    },
    {
      title: '5. Review and Defend',
      detail: `Close by defending the final choice with evidence, consequences, and a clear explanation of why the alternative is weaker.`,
    },
  ];
  const decisionFrames: LessonInsightCard[] = [
    {
      title: 'Speed vs Clarity',
      detail: `A faster approach may appear attractive, but if it becomes hard to explain, verify, or maintain, the overall result may become weaker.`,
    },
    {
      title: 'Simple Model vs Real Complexity',
      detail: `A clean explanation helps learning, but strong technical understanding comes from knowing where the simplified model stops matching reality.`,
    },
    {
      title: 'Local Fix vs System View',
      detail: `A choice that improves one part of the system can still hurt the wider workflow if dependencies or constraints are ignored.`,
    },
    {
      title: 'Immediate Success vs Future Stability',
      detail: `A decision should be judged not just by whether it works now, but by how well it survives growth, stress, and change later on.`,
    },
  ];
  const scenarioSnapshots: LessonInsightCard[] = [
    {
      title: 'Scenario: Implementation',
      detail: `${sessionTitle} matters during implementation because it influences how a team turns ideas into working steps without losing correctness or control.`,
    },
    {
      title: 'Scenario: Troubleshooting',
      detail: `In debugging or review work, ${sessionTitle} helps separate symptoms from causes so fixes are based on reasoning instead of guesswork.`,
    },
    {
      title: 'Scenario: Design Review',
      detail: `When comparing alternatives, ${sessionTitle} provides the language for discussing tradeoffs, constraints, and the likely technical impact of each option.`,
    },
  ];
  const commonPitfalls = [
    `Explaining the topic at definition level without showing how it behaves in a real system or workflow.`,
    `Making a choice without discussing what tradeoff is being accepted.`,
    `Treating the lesson as isolated theory instead of a tool for design, diagnosis, or implementation.`,
    `Stopping at what works now without checking how the idea behaves under change, scale, or failure.`,
  ];
  const failureSignals = [
    `The explanation sounds correct, but it cannot predict what would happen if one condition changed.`,
    `The reasoning never mentions constraints, side effects, or technical consequences.`,
    `The topic is applied as a memorized recipe rather than as a justified decision process.`,
    `The final answer describes symptoms, but the root causes are still unclear.`,
  ];
  const deepDiveQuestions = [
    `Which part of ${sessionTitle} becomes most important when the system is under pressure, and why?`,
    `What evidence would tell you that your first explanation is incomplete or misleading?`,
    `How would you compare two approaches to ${sessionTitle} without relying on opinion alone?`,
    `If you had to teach this lesson through one real scenario, which scenario would you choose and why?`,
  ];

  return {
    title: sessionTitle,
    notes: [
      `Welcome to ${sessionTitle} in the ${courseTitle} track.`,
      `This lesson focuses on the main ideas, technical vocabulary, and practical workflow used in ${courseTitle}.`,
      `Pay attention to the core concepts introduced in ${sessionTitle}, because they will support later sessions and stronger decision-making.`,
      `As you proceed, connect each concept to a real project or technical scenario so the lesson becomes practical and memorable.`,
      `The strongest explanations in this lesson should connect a concept, a technical consequence, and a justified choice.`,
      `Use the Q&A and quiz sections to confirm understanding before moving to the next milestone.`,
    ],
    learningObjectives: [
      `Describe the main purpose of ${sessionTitle}.`,
      `Identify the important ideas and tradeoffs covered in ${sessionTitle}.`,
      `Relate the lesson to practical work in ${courseTitle}.`,
      `Prepare for review questions based on ${sessionTitle}.`,
    ],
    sections: [
      {
        title: 'Topic Overview',
        subtopics: [
          {
            title: 'What This Session Covers',
            content: [
              `${sessionTitle} introduces foundational ideas used throughout the ${courseTitle} curriculum.`,
              `The purpose is to move from broad awareness into clear technical understanding and usable judgment.`,
              `Treat each idea as part of a wider system, workflow, or design choice rather than as an isolated definition.`,
            ],
          },
        ],
      },
      {
        title: 'Subtopics',
        subtopics: [
          {
            title: 'Core Principles',
            content: [
              `Identify the definitions, workflows, and reasoning patterns related to ${sessionTitle}.`,
              `Connect these principles to the larger ${courseTitle} learning path.`,
            ],
          },
          {
            title: 'Practical Context',
            content: [
              `Relate ${sessionTitle} to implementation work, troubleshooting, design review, and project problem-solving.`,
              `Use examples and case studies to make the topic concrete, testable, and memorable.`,
            ],
          },
          {
            title: 'Analysis Lens',
            content: analysisPrompts,
          },
        ],
      },
    ],
    keyTerms: [courseTitle, sessionTitle, 'analysis', 'workflow', 'implementation', 'application'],
    keyTermDetails,
    visualExplainers,
    background: [
      `${sessionTitle} is part of the wider ${courseTitle} learning path and should be read as a foundational chapter rather than a standalone note.`,
      `This background section helps connect the session to earlier knowledge, practical work, and later problem-solving tasks.`,
      `A deeper reading should always ask what tradeoffs, constraints, or system effects become visible once the concept is applied.`,
    ],
    analysisPrompts,
    processFlow,
    decisionFrames,
    scenarioSnapshots,
    commonPitfalls,
    failureSignals,
    deepDiveQuestions,
    workedExample: [
      `Scenario: a team applies ${sessionTitle} to a practical ${courseTitle} task or project problem.`,
      `Step 1: identify the important ideas in the topic and the decision that depends on them.`,
      `Step 2: connect those ideas to a real technical situation and explain the likely tradeoffs.`,
      `Step 3: compare at least two possible approaches and explain why one is stronger.`,
      `Step 4: explain the result clearly and use it as revision before the short test.`,
    ],
    practiceTasks: [
      `Prepare short notes summarizing the main ideas behind ${sessionTitle}.`,
      `List two practical scenarios where ${sessionTitle} would be useful in ${courseTitle}.`,
      `Discuss the topic with examples from projects, debugging work, or implementation tasks.`,
      `Write a short decision note explaining how ${sessionTitle} would guide one technical choice in practice.`,
    ],
    summaryPoints: [
      `${sessionTitle} introduces important ideas used throughout the ${courseTitle} curriculum.`,
      `The lesson should be understood both conceptually and practically.`,
      `The review and quiz stages are meant to confirm readiness before moving to the next session.`,
      `A solid explanation should show not just what the topic is, but how it changes technical reasoning.`,
    ],
    shortTestTips: [
      `Revise the core terms and topic summary before answering.`,
      `Check that you can explain the lesson without copying the wording directly.`,
      `Use the practice and worked example sections as your final review.`,
      `If possible, defend one decision or tradeoff out loud before submitting your answers.`,
    ],
    qaQuestions: [
      {
        q: `What is the main goal of the ${sessionTitle} session?`,
        options: [
          'To build understanding of the session fundamentals',
          'To skip directly to the final review',
          'To avoid practical examples',
          'To replace all previous lessons',
        ],
        correct: 0,
      },
      {
        q: 'What is the best way to benefit from this lesson?',
        options: [
          'Ignore the examples',
          'Relate the concepts to real tasks and workflows',
          'Memorize only the title',
          'Skip the questions',
        ],
        correct: 1,
      },
    ],
    quizQuestions: [
      {
        q: `Which statement best describes ${sessionTitle}?`,
        options: [
          'It introduces concepts you can apply in practice',
          'It has no connection to the rest of the course',
          'It is only for entertainment',
          'It replaces every other session',
        ],
        correct: 0,
      },
      {
        q: 'What should you do before moving to the next session?',
        options: [
          'Close the lesson immediately',
          'Confirm understanding through Q&A and quiz review',
          'Delete your progress',
          'Skip the dashboard entirely',
        ],
        correct: 1,
      },
      {
        q: 'Why are lesson activities included in the flow?',
        options: [
          'To help reinforce learning and readiness',
          'To make the page longer',
          'To prevent progress permanently',
          'To remove the need for practice',
        ],
        correct: 0,
      },
    ],
  };
}

function parseSessionDurationSeconds(sessionLabel: string): number {
  if (!sessionLabel) return 3600;

  const hMatch = sessionLabel.match(/(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m)?/i);
  if (hMatch) {
    const hrs = parseFloat(hMatch[1]);
    const mins = hMatch[2] ? parseInt(hMatch[2], 10) : 0;
    return Math.round(hrs * 3600 + mins * 60);
  }

  const mMatch = sessionLabel.match(/(\d+)\s*m/i);
  if (mMatch) {
    return parseInt(mMatch[1], 10) * 60;
  }

  return 3600;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs ? `${hrs}h ` : ''}${mins}m ${secs}s`;
}

function normalizeSessionTitle(label: string): string {
  return label
    .replace(/^\d+\.\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    .toLowerCase();
}

function resolveSessionLabel(course: string, session: string): string {
  if (!course || !session) {
    return session;
  }

  const track = resolveTrackSessions(course);
  const exactMatch = track.find((item) => item.label === session);
  if (exactMatch) {
    return exactMatch.label;
  }

  const normalizedSession = normalizeSessionTitle(session);
  const looseMatch = track.find((item) => normalizeSessionTitle(item.label) === normalizedSession);
  return looseMatch?.label || session;
}

function createEmptyCourseProgress(): CourseProgress {
  return {
    topicScores: {},
    finalExamResult: null,
    readingProgress: {},
  };
}

function createTopicReadState(requiredSeconds: number, startedAt = new Date().toISOString(), completedAt: string | null = null): TopicReadState {
  return {
    startedAt,
    requiredSeconds,
    completedAt,
  };
}

function pickLatestQuizResult(primary: QuizResult | null, secondary: QuizResult | null): QuizResult | null {
  if (!primary) return secondary;
  if (!secondary) return primary;

  return new Date(primary.submittedAt).getTime() >= new Date(secondary.submittedAt).getTime() ? primary : secondary;
}

function normalizeTopicReadState(value: unknown, fallbackSeconds = 3600): TopicReadState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<TopicReadState>;
  const startedAt = typeof candidate.startedAt === 'string' && candidate.startedAt ? candidate.startedAt : new Date().toISOString();
  const requiredSeconds =
    typeof candidate.requiredSeconds === 'number' && Number.isFinite(candidate.requiredSeconds) && candidate.requiredSeconds > 0
      ? Math.round(candidate.requiredSeconds)
      : fallbackSeconds;
  const completedAt = typeof candidate.completedAt === 'string' && candidate.completedAt ? candidate.completedAt : null;

  return {
    startedAt,
    requiredSeconds,
    completedAt,
  };
}

function buildCourseProgressFromAssessmentRecords(records: LessonAssessmentRecord[], course: string): CourseProgress {
  const nextProgress = createEmptyCourseProgress();

  records
    .filter((record) => record.course === course)
    .forEach((record) => {
      const result: QuizResult = {
        score: record.score,
        correct: record.correct_answers,
        total: record.total_questions,
        submittedAt: record.submitted_at,
      };

      if (record.assessment_type === 'final_exam') {
        nextProgress.finalExamResult = pickLatestQuizResult(nextProgress.finalExamResult, result);
        return;
      }

      nextProgress.topicScores[record.session_label] = pickLatestQuizResult(nextProgress.topicScores[record.session_label] || null, result) || result;
      nextProgress.readingProgress[record.session_label] = createTopicReadState(
        record.read_time_required_seconds || parseSessionDurationSeconds(record.session_label),
        record.read_time_completed_at || record.submitted_at,
        record.read_time_completed_at || record.submitted_at,
      );
    });

  return nextProgress;
}

function mergeCourseProgress(localProgress: CourseProgress, remoteProgress: CourseProgress): CourseProgress {
  const mergedTopicScores: Record<string, QuizResult> = { ...remoteProgress.topicScores };

  Object.entries(localProgress.topicScores).forEach(([label, result]) => {
    mergedTopicScores[label] = pickLatestQuizResult(result, mergedTopicScores[label] || null) || result;
  });

  const mergedReadingProgress: Record<string, TopicReadState> = { ...remoteProgress.readingProgress };

  Object.entries(localProgress.readingProgress).forEach(([label, readState]) => {
    const normalizedLocal = normalizeTopicReadState(readState, parseSessionDurationSeconds(label));
    const normalizedRemote = normalizeTopicReadState(mergedReadingProgress[label], parseSessionDurationSeconds(label));

    if (!normalizedLocal) {
      return;
    }

    if (!normalizedRemote) {
      mergedReadingProgress[label] = normalizedLocal;
      return;
    }

    mergedReadingProgress[label] = {
      startedAt:
        new Date(normalizedLocal.startedAt).getTime() <= new Date(normalizedRemote.startedAt).getTime()
          ? normalizedLocal.startedAt
          : normalizedRemote.startedAt,
      requiredSeconds: Math.max(normalizedLocal.requiredSeconds, normalizedRemote.requiredSeconds),
      completedAt: normalizedLocal.completedAt || normalizedRemote.completedAt,
    };
  });

  return {
    topicScores: mergedTopicScores,
    finalExamResult: pickLatestQuizResult(localProgress.finalExamResult, remoteProgress.finalExamResult),
    readingProgress: mergedReadingProgress,
  };
}

function getNextUnlockedSessionLabel(
  sessionLabels: string[],
  topicScores: Record<string, QuizResult>,
  readingProgress: Record<string, TopicReadState>,
  fallbackLabel = '',
): string {
  // Prefer continuing an in-progress session over jumping straight to the first quiz-incomplete session.
  const inProgressSession = sessionLabels.find(
    (label) => Boolean(readingProgress[label]) && !topicScores[label],
  );
  if (inProgressSession) {
    return inProgressSession;
  }

  const firstIncomplete = sessionLabels.find((label) => !topicScores[label]);
  return firstIncomplete || fallbackLabel || sessionLabels[0] || '';
}

function slugifyStorageValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function buildCourseProgressKey(storageKey: string, course: string): string {
  if (!storageKey || !course) {
    return '';
  }

  return `${storageKey}_progress_${slugifyStorageValue(course)}`;
}

function calculateQuizResult(questions: QuestionSet, answers: Record<number, number>): QuizResult {
  const total = questions.length;
  const correct = questions.reduce((sum, question, index) => {
    return sum + (answers[index] === question.correct ? 1 : 0);
  }, 0);

  return {
    score: total ? Math.round((correct / total) * 100) : 0,
    correct,
    total,
    submittedAt: new Date().toISOString(),
  };
}

function createFinalExamQuestions(course: string): QuestionSet {
  return resolveTrackSessions(course).map((session, index) => {
    if (index % 2 === 0) {
      return {
        q: `Topic ${index + 1}: What best describes ${session.title}?`,
        options: [
          `It focuses on ${session.focus}.`,
          'It is mainly about unrelated payroll and finance routines.',
          'It avoids technical service delivery and customer-care practice.',
          'It replaces the need for every other topic in the course.',
        ],
        correct: 0,
      };
    }

    return {
      q: `Topic ${index + 1}: Which set is most associated with ${session.title}?`,
      options: [
        session.tools.slice(0, 2).join(' and '),
        'budgeting and customs clearance',
        'animation and illustration',
        'warehouse dispatch and fleet tracking',
      ],
      correct: 0,
    };
  });
}

function resolveLessonData(course: string, session: string): LessonData | null {
  if (!course || !session) {
    return null;
  }

  const exactCourse = lessonContent[course];
  if (exactCourse?.[session]) {
    return exactCourse[session];
  }

  const generatedTrack = resolveTrackSessions(course);
  const generatedSession = generatedTrack.find((entry) => entry.label === session);
  if (generatedSession) {
    return createLessonFromCurriculum(generatedSession);
  }

  return buildFallbackLesson(course, session);
}

const Lesson: React.FC = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState<LessonPhase>('loading');
  const [qaAnswers, setQaAnswers] = useState<Record<number, number>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [finalExamAnswers, setFinalExamAnswers] = useState<Record<number, number>>({});
  const [narrating, setNarrating] = useState(true);
  const [narratorSeconds, setNarratorSeconds] = useState(0);
  const [narratorTotalSeconds, setNarratorTotalSeconds] = useState(3600);
  const [narratorReady, setNarratorReady] = useState(false);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>(createEmptyCourseProgress());
  const [latestTopicResult, setLatestTopicResult] = useState<QuizResult | null>(null);
  const [latestFinalExamResult, setLatestFinalExamResult] = useState<QuizResult | null>(null);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [assessmentSyncError, setAssessmentSyncError] = useState('');
  const [localProgressLoaded, setLocalProgressLoaded] = useState(false);
  const [remoteProgressAttempted, setRemoteProgressAttempted] = useState(false);

  // Parse from sessionStorage (passed from Dashboard or ServicesGrid)
  let storageKey = '';

  if (consultationId) {
    if (consultationId.startsWith('service-')) {
      const serviceId = consultationId.split('service-')[1];
      storageKey = `lesson_service_${serviceId}`;
    } else {
      storageKey = `lesson_${consultationId}`;
    }
  }

  const sessionData = storageKey ? sessionStorage.getItem(storageKey) : null;
  const searchParams = new URLSearchParams(location.search);
  const queryCourse = searchParams.get('course') || '';
  const querySession = searchParams.get('session') || '';
  let payload = { course: queryCourse, session: querySession };

  if (sessionData) {
    try {
      payload = JSON.parse(sessionData);
    } catch (error) {
      console.error('Could not parse stored lesson payload:', error);
    }
  }

  const course = payload.course || queryCourse;
  const session = payload.session || querySession;
  const resolvedSession = resolveSessionLabel(course, session);

  const courseData = resolveLessonData(course, resolvedSession);
  const trackSessions = resolveTrackSessions(course);
  const sessionLabels = trackSessions.map((item) => item.label);
  const currentSessionIndex = sessionLabels.indexOf(resolvedSession);
  const nextSessionLabel = currentSessionIndex >= 0 ? sessionLabels[currentSessionIndex + 1] || '' : '';
  const isLastSession = currentSessionIndex >= 0 && currentSessionIndex === sessionLabels.length - 1;
  const chapterNumber = currentSessionIndex >= 0 ? currentSessionIndex + 1 : 1;
  const progressStorageKey = buildCourseProgressKey(storageKey, course);
  const orderedTopicResults = sessionLabels.map((label, index) => ({
    label,
    topicNumber: index + 1,
    result: courseProgress.topicScores[label] || null,
  }));
  const completedTopicCount = orderedTopicResults.filter((item) => Boolean(item.result)).length;
  const topicAverageScore = completedTopicCount
    ? Math.round(
        orderedTopicResults.reduce((sum, item) => sum + (item.result?.score || 0), 0) / completedTopicCount,
      )
    : 0;
  const allTopicQuizzesComplete =
    sessionLabels.length > 0 && sessionLabels.every((label) => Boolean(courseProgress.topicScores[label]));
  const firstIncompleteSession = sessionLabels.find((label) => !courseProgress.topicScores[label]) || '';
  const highestUnlockedSessionLabel = getNextUnlockedSessionLabel(
    sessionLabels,
    courseProgress.topicScores,
    courseProgress.readingProgress,
    resolvedSession,
  );
  const highestUnlockedSessionIndex = sessionLabels.indexOf(highestUnlockedSessionLabel);
  const currentTopicUnlocked =
    currentSessionIndex === -1 ||
    Boolean(courseProgress.topicScores[resolvedSession]) ||
    Boolean(courseProgress.readingProgress[resolvedSession]) ||
    currentSessionIndex <= Math.max(highestUnlockedSessionIndex, 0);
  const currentTopicResult = latestTopicResult || courseProgress.topicScores[resolvedSession] || null;
  const finalExamQuestions = createFinalExamQuestions(course);
  const finalExamResult = latestFinalExamResult || courseProgress.finalExamResult;
  const currentReadState = normalizeTopicReadState(
    courseProgress.readingProgress[resolvedSession],
    parseSessionDurationSeconds(resolvedSession),
  );
  const readTimeCompletedAt = currentReadState?.completedAt || null;
  const isPersistableConsultation = Boolean(consultationId && !consultationId.startsWith('service-'));
  const progressSyncReady = localProgressLoaded && (!isPersistableConsultation || remoteProgressAttempted);
  const useUnifiedTopicCards = ['loading', 'narrator'].includes(phase);
  const isFixedTopicPhase = useUnifiedTopicCards;
  const resolvedSessionDuration = resolvedSession.match(/\(([^)]+)\)/)?.[1] || '';

  const goToDashboard = () => {
    navigate('/?view=dashboard');
  };

  const goToSession = (targetSession: string) => {
    if (!consultationId || !storageKey || !targetSession) {
      goToDashboard();
      return;
    }

    sessionStorage.setItem(storageKey, JSON.stringify({ course, session: targetSession }));
    setQaAnswers({});
    setQuizAnswers({});
    setFinalExamAnswers({});
    setLatestTopicResult(null);
    setNarrating(true);
    setAssessmentSyncError('');
    setPhase('narrator');

    navigate(`/lesson/${consultationId}?course=${encodeURIComponent(course)}&session=${encodeURIComponent(targetSession)}`);
  };

  const restartCurrentTopic = () => {
    setQaAnswers({});
    setQuizAnswers({});
    setFinalExamAnswers({});
    setLatestTopicResult(null);
    setNarratorSeconds(0);
    setNarratorReady(false);
    setNarrating(true);
    setAssessmentSyncError('');
    setCourseProgress((prev) => ({
      ...prev,
      readingProgress: {
        ...prev.readingProgress,
        [resolvedSession]: createTopicReadState(narratorTotalSeconds),
      },
    }));
    setPhase('narrator');
  };

  const persistAssessmentRecord = async (record: {
    sessionLabel: string;
    topicNumber: number;
    assessmentType: 'topic_quiz' | 'final_exam';
    result: QuizResult;
    readTimeRequiredSeconds: number;
    readTimeCompletedAt: string | null;
  }) => {
    if (!isPersistableConsultation || !consultationId) {
      return null;
    }

    setSavingAssessment(true);
    try {
      const response = await api.saveLessonAssessment(consultationId, {
        course,
        session_label: record.sessionLabel,
        topic_number: record.topicNumber,
        assessment_type: record.assessmentType,
        score: record.result.score,
        correct_answers: record.result.correct,
        total_questions: record.result.total,
        read_time_required_seconds: record.readTimeRequiredSeconds,
        read_time_completed_at: record.readTimeCompletedAt,
      });
      setAssessmentSyncError('');
      setCourseProgress((prev) => mergeCourseProgress(prev, buildCourseProgressFromAssessmentRecords([response.record], course)));
      return response.record;
    } catch (error: unknown) {
      console.error('Could not save lesson assessment:', error);
      setAssessmentSyncError(getErrorMessage(error, 'Could not save the quiz result to the dashboard records.'));
      return null;
    } finally {
      setSavingAssessment(false);
    }
  };

  useEffect(() => {
    if (storageKey && course && resolvedSession) {
      sessionStorage.setItem(storageKey, JSON.stringify({ course, session: resolvedSession }));
    }
  }, [storageKey, course, resolvedSession]);

  useEffect(() => {
    if (!consultationId || !course || !session || session === resolvedSession) {
      return;
    }

    navigate(
      `/lesson/${consultationId}?course=${encodeURIComponent(course)}&session=${encodeURIComponent(resolvedSession)}`,
      { replace: true },
    );
  }, [consultationId, course, session, resolvedSession, navigate]);

  useEffect(() => {
    setLocalProgressLoaded(false);
    if (!progressStorageKey) {
      setLatestFinalExamResult(null);
      setCourseProgress(createEmptyCourseProgress());
      setLocalProgressLoaded(true);
      return;
    }

    const storedProgress = sessionStorage.getItem(progressStorageKey);
    if (!storedProgress) {
      setLatestFinalExamResult(null);
      setCourseProgress(createEmptyCourseProgress());
      setLocalProgressLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedProgress);
      const parsedReadingProgress = Object.fromEntries(
        Object.entries(parsed?.readingProgress || {})
          .map(([label, value]) => [label, normalizeTopicReadState(value, parseSessionDurationSeconds(label))])
          .filter((entry): entry is [string, TopicReadState] => Boolean(entry[1])),
      );
      setLatestFinalExamResult(null);
      setCourseProgress({
        topicScores: parsed?.topicScores || {},
        finalExamResult: parsed?.finalExamResult || null,
        readingProgress: parsedReadingProgress,
      });
      setLocalProgressLoaded(true);
    } catch (error) {
      console.error('Could not parse stored course progress:', error);
      setLatestFinalExamResult(null);
      setCourseProgress(createEmptyCourseProgress());
      setLocalProgressLoaded(true);
    }
  }, [progressStorageKey]);

  useEffect(() => {
    let active = true;
    setRemoteProgressAttempted(false);

    if (!isPersistableConsultation || !consultationId || !course || !user) {
      setRemoteProgressAttempted(true);
      return () => {
        active = false;
      };
    }

    api
      .getLessonAssessments()
      .then(({ records }) => {
        if (!active) {
          return;
        }

        const remoteRecords = records.filter((record) => record.consultation_id === consultationId);
        setCourseProgress((prev) => mergeCourseProgress(prev, buildCourseProgressFromAssessmentRecords(remoteRecords, course)));
        setAssessmentSyncError('');
        setRemoteProgressAttempted(true);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        console.error('Could not sync lesson assessments:', error);
        setAssessmentSyncError(getErrorMessage(error, 'Could not sync saved lesson progress.'));
        setRemoteProgressAttempted(true);
      });

    return () => {
      active = false;
    };
  }, [consultationId, course, isPersistableConsultation, user]);

  useEffect(() => {
    if (!progressStorageKey) {
      return;
    }

    sessionStorage.setItem(progressStorageKey, JSON.stringify(courseProgress));
  }, [progressStorageKey, courseProgress]);

  useEffect(() => {
    if (!progressSyncReady || !consultationId || !course || !resolvedSession || !sessionLabels.length) {
      return;
    }

    let fallbackSession: string | null = null;

    if (!currentTopicUnlocked) {
      fallbackSession = highestUnlockedSessionLabel || sessionLabels[0];
    } else if (
      highestUnlockedSessionLabel &&
      resolvedSession !== highestUnlockedSessionLabel &&
      Boolean(courseProgress.readingProgress[highestUnlockedSessionLabel])
    ) {
      // If there's an in-progress session the user was last on, prioritize it.
      fallbackSession = highestUnlockedSessionLabel;
    }

    if (!fallbackSession || fallbackSession === resolvedSession) {
      return;
    }

    if (storageKey) {
      sessionStorage.setItem(storageKey, JSON.stringify({ course, session: fallbackSession }));
    }

    navigate(
      `/lesson/${consultationId}?course=${encodeURIComponent(course)}&session=${encodeURIComponent(fallbackSession)}`,
      { replace: true },
    );
  }, [
    consultationId,
    course,
    courseProgress.readingProgress,
    currentTopicUnlocked,
    highestUnlockedSessionLabel,
    navigate,
    progressSyncReady,
    resolvedSession,
    sessionLabels,
    storageKey,
  ]);

  useEffect(() => {
    if ((phase === 'qa' || phase === 'quiz') && !readTimeCompletedAt) {
      setPhase('narrator');
    }
  }, [phase, readTimeCompletedAt]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !courseData) {
      navigate('/');
      return;
    }
    setPhase((current) => (current === 'loading' ? 'narrator' : current));
  }, [user, courseData, loading, navigate]);

  useEffect(() => {
    if (!resolvedSession) return;
    const totalSeconds = parseSessionDurationSeconds(resolvedSession);
    setQaAnswers({});
    setQuizAnswers({});
    setFinalExamAnswers({});
    setLatestTopicResult(null);
    setNarratorTotalSeconds(totalSeconds);
    setPhase((current) => (current === 'loading' ? current : 'narrator'));
    setNarrating(true);
    setCourseProgress((prev) => {
      const existingReadState = normalizeTopicReadState(prev.readingProgress[resolvedSession], totalSeconds);
      return {
        ...prev,
        readingProgress: {
          ...prev.readingProgress,
          [resolvedSession]:
            existingReadState && existingReadState.requiredSeconds === totalSeconds
              ? existingReadState
              : createTopicReadState(totalSeconds, existingReadState?.startedAt, existingReadState?.completedAt || null),
        },
      };
    });
  }, [resolvedSession]);

  const narratorProgressPercent = narratorTotalSeconds
    ? Math.round((narratorSeconds / narratorTotalSeconds) * 100)
    : 0;

  useEffect(() => {
    if (!currentReadState) {
      setNarratorSeconds(0);
      setNarratorReady(false);
      return;
    }

    const updateNarratorReadiness = () => {
      const completedAt = currentReadState.completedAt ? new Date(currentReadState.completedAt).getTime() : null;
      const startedAt = new Date(currentReadState.startedAt).getTime();
      const elapsedSeconds = completedAt
        ? currentReadState.requiredSeconds
        : Math.min(
            currentReadState.requiredSeconds,
            Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
          );

      setNarratorSeconds(elapsedSeconds);

      const ready = elapsedSeconds >= currentReadState.requiredSeconds;
      setNarratorReady(ready);

      if (ready && !currentReadState.completedAt) {
        setCourseProgress((prev) => ({
          ...prev,
          readingProgress: {
            ...prev.readingProgress,
            [resolvedSession]: createTopicReadState(
              currentReadState.requiredSeconds,
              currentReadState.startedAt,
              new Date().toISOString(),
            ),
          },
        }));
      }
    };

    updateNarratorReadiness();

    if (currentReadState.completedAt || phase !== 'narrator' || !narrating) {
      return;
    }

    const interval = window.setInterval(() => {
      updateNarratorReadiness();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentReadState, narrating, phase, resolvedSession]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNarratorComplete = () => {
    if (!narratorReady) {
      return;
    }
    setNarrating(false);
    setPhase('qa');
  };

  const handleQASubmit = () => {
    if (!narratorReady) {
      setPhase('narrator');
      return;
    }
    setPhase('quiz');
  };

  const handleQuizSubmit = async () => {
    if (!narratorReady || !readTimeCompletedAt) {
      setPhase('narrator');
      return;
    }

    if (Object.keys(quizAnswers).length < courseData.quizQuestions.length) {
      return;
    }

    const result = calculateQuizResult(courseData.quizQuestions, quizAnswers);
    setLatestTopicResult(result);
    setCourseProgress((prev) => ({
      ...prev,
      topicScores: {
        ...prev.topicScores,
        [resolvedSession]: result,
      },
    }));
    await persistAssessmentRecord({
      sessionLabel: resolvedSession,
      topicNumber: chapterNumber,
      assessmentType: 'topic_quiz',
      result,
      readTimeRequiredSeconds: narratorTotalSeconds,
      readTimeCompletedAt,
    });
    setPhase(isLastSession ? 'course-summary' : 'complete');
  };

  const handleStartFinalExam = () => {
    setFinalExamAnswers({});
    setLatestFinalExamResult(null);
    setPhase('final-exam');
  };

  const handleFinalExamSubmit = async () => {
    if (Object.keys(finalExamAnswers).length < finalExamQuestions.length) {
      return;
    }

    const result = calculateQuizResult(finalExamQuestions, finalExamAnswers);
    setLatestFinalExamResult(result);
    setCourseProgress((prev) => ({
      ...prev,
      finalExamResult: result,
    }));
    await persistAssessmentRecord({
      sessionLabel: `${course} Final Exam`,
      topicNumber: sessionLabels.length,
      assessmentType: 'final_exam',
      result,
      readTimeRequiredSeconds: 0,
      readTimeCompletedAt: new Date().toISOString(),
    });
    setPhase('final-result');
  };

  const handleNextSession = () => {
    if (!nextSessionLabel) {
      goToDashboard();
      return;
    }

    goToSession(nextSessionLabel);
  };

  const fixedLayoutRootClass = isFixedTopicPhase
    ? 'min-h-screen overflow-x-hidden bg-gradient-to-br from-[#08111f] via-[#0b1730] to-[#101f3c] pt-16 pb-6'
    : 'min-h-screen bg-gradient-to-br from-[#0a1628] to-[#0f1f35] pt-20 pb-12';
  const fixedLayoutContainerClass = isFixedTopicPhase
    ? 'max-w-7xl mx-auto px-4 flex flex-col'
    : 'max-w-4xl mx-auto px-4';

  const topicNavigationPanel = (
    <aside className="rounded-3xl border border-cyan-500/20 bg-[#0d1b31]/95 p-4 flex flex-col">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-2">Course Content</p>
        <h2 className="text-lg font-bold text-white">{course}</h2>
        <p className="text-xs text-slate-400 mt-1">One topic at a time. Complete the quiz to unlock the next one.</p>
      </div>
      <div className="space-y-2">
        {sessionLabels.map((label, index) => {
          const isCurrentTopic = label === resolvedSession;
          const isCompletedTopic = Boolean(courseProgress.topicScores[label]);
          const isUnlockedTopic = index <= Math.max(highestUnlockedSessionIndex, 0) || isCompletedTopic;
          return (
            <div
              key={label}
              className={`rounded-2xl border px-3 py-2 transition-all ${
                isCurrentTopic
                  ? 'border-cyan-400/40 bg-cyan-500/10'
                  : isCompletedTopic
                    ? 'border-emerald-400/25 bg-emerald-500/10'
                    : isUnlockedTopic
                      ? 'border-cyan-400/20 bg-cyan-500/5'
                      : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold leading-4 text-white">{label}</p>
                <span
                  className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isCurrentTopic
                      ? 'bg-cyan-400/20 text-cyan-200'
                      : isCompletedTopic
                        ? 'bg-emerald-400/20 text-emerald-200'
                        : isUnlockedTopic
                          ? 'bg-cyan-400/15 text-cyan-200'
                          : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {isCurrentTopic ? 'Now' : isCompletedTopic ? 'Done' : isUnlockedTopic ? 'Open' : 'Locked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );

  if (!courseData) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Loading lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={fixedLayoutRootClass}>
      <div className={fixedLayoutContainerClass}>
        {/* Header */}
        <div className={isFixedTopicPhase ? 'mb-4' : 'mb-8'}>
          <button
            onClick={goToDashboard}
            className="text-cyan-400 hover:text-cyan-300 text-sm mb-4"
          >
            {'< '}Back to Dashboard
          </button>
          <div className={isFixedTopicPhase ? 'flex flex-wrap items-end justify-between gap-4' : ''}>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70 mb-2">{course}</p>
              <h1 className={`${isFixedTopicPhase ? 'text-2xl' : 'text-4xl'} font-bold text-white mb-2`}>
                {courseData.title}
              </h1>
              <p className="text-gray-400">{resolvedSession}</p>
            </div>

            {isFixedTopicPhase ? (
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">Progress</p>
                  <p className="text-lg font-bold text-white">{completedTopicCount}/{sessionLabels.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-1">Current Score</p>
                  <p className="text-lg font-bold text-white">{currentTopicResult ? `${currentTopicResult.score}%` : 'Pending'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/80 mb-1">Duration</p>
                  <p className="text-lg font-bold text-white">{resolvedSessionDuration || '1h'}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">Topic Progress</p>
                  <p className="text-2xl font-bold text-white">{completedTopicCount}/{sessionLabels.length}</p>
                  <p className="text-sm text-slate-300">Topic quizzes completed</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Current Topic Score</p>
                  <p className="text-2xl font-bold text-white">{currentTopicResult ? `${currentTopicResult.score}%` : 'Pending'}</p>
                  <p className="text-sm text-slate-300">
                    {currentTopicResult ? `${currentTopicResult.correct}/${currentTopicResult.total} correct` : 'Submit the topic quiz to record a score'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Final Exam</p>
                  <p className="text-2xl font-bold text-white">{finalExamResult ? `${finalExamResult.score}/100` : allTopicQuizzesComplete ? 'Unlocked' : 'Locked'}</p>
                  <p className="text-sm text-slate-300">
                    {finalExamResult ? `${finalExamResult.correct}/${finalExamResult.total} correct` : allTopicQuizzesComplete ? 'Available after the topic summary' : 'Complete all topic quizzes first'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {assessmentSyncError && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {assessmentSyncError}
          </div>
        )}

        {/* NARRATOR PHASE */}
        {(phase === 'loading' || phase === 'narrator') && (
          useUnifiedTopicCards ? (
            <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              {topicNavigationPanel}

              <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1b31]/95 p-5 flex flex-col min-h-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-2">AI Narrator</p>
                    <h2 className="text-2xl font-bold text-white">Topic {chapterNumber} of {sessionLabels.length}</h2>
                    <div className="mt-2 space-y-2">
                      {courseData.notes.slice(0, 4).map((note) => (
                        <p key={note} className="text-sm text-slate-300">
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">Reading Timer</p>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div className="h-2 bg-cyan-500" style={{ width: `${narratorProgressPercent}%` }} />
                    </div>
                    <p className="text-sm text-white">{formatDuration(narratorSeconds)} / {formatDuration(narratorTotalSeconds)}</p>
                    <p className="text-xs text-slate-400 mt-1">Planned topic duration: {formatDuration(narratorTotalSeconds)}</p>
                  </div>
                </div>

                <div className="mb-4 grid gap-4 xl:grid-cols-3">
                  {courseData.visualExplainers.map((explainer) => (
                    <div key={explainer.title} className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">{explainer.title}</p>
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#091321]">
                        <LessonVisualGraphic explainer={explainer} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{explainer.caption}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_320px] flex-1 min-h-0">
                  <div className="grid gap-4 content-start">
                    <div className="grid gap-4 xl:grid-cols-3">
                      {courseData.sections.slice(0, 3).map((section, sectionIdx) => (
                        <div key={section.title} className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-2">
                            Smaller Topic {sectionIdx + 1}
                          </p>
                          <h3 className="text-base font-semibold text-white mb-3">{section.title}</h3>
                          <div className="space-y-3">
                            {section.subtopics.map((subtopic) => (
                              <div key={subtopic.title}>
                                <p className="text-sm font-medium text-cyan-200">{subtopic.title}</p>
                                <ul className="mt-2 space-y-1">
                                  {subtopic.content.map((item) => (
                                    <li key={item} className="text-xs leading-5 text-slate-300">
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">What You Should Leave With</p>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {courseData.learningObjectives.map((objective) => (
                          <div key={objective} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                            {objective}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 content-start">
                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Key Terms</p>
                      <div className="flex flex-wrap gap-2">
                        {courseData.keyTerms.map((term) => (
                          <span key={term} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-100">
                            {term}
                          </span>
                        ))}
                      </div>
                      <ul className="mt-4 space-y-2">
                        {courseData.keyTermDetails.map((detail) => (
                          <li key={detail} className="text-sm leading-6 text-slate-200">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Practice</p>
                      <ul className="space-y-2">
                        {courseData.practiceTasks.map((task) => (
                          <li key={task} className="text-sm leading-6 text-slate-200">
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-300/80 mb-2">Quick Summary</p>
                      <ul className="space-y-2">
                        {courseData.summaryPoints.map((point) => (
                          <li key={point} className="text-sm text-slate-200">{point}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-rose-300/80 mb-2">Worked Example</p>
                      <ul className="space-y-2">
                        {courseData.workedExample.map((step) => (
                          <li key={step} className="text-sm leading-6 text-slate-200">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300/80 mb-2">Analysis Lens</p>
                      <ul className="space-y-2">
                        {courseData.analysisPrompts.map((prompt) => (
                          <li key={prompt} className="text-sm leading-6 text-slate-200">
                            {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-teal-300/80 mb-2">Deeper Context</p>
                      <ul className="space-y-2">
                        {courseData.background.map((item) => (
                          <li key={item} className="text-sm leading-6 text-slate-200">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-300/80 mb-2">Revision Focus</p>
                      <ul className="space-y-2">
                        {courseData.shortTestTips.map((tip) => (
                          <li key={tip} className="text-sm leading-6 text-slate-200">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-3">Concept Flow</p>
                    <div className="grid gap-3 xl:grid-cols-5">
                      {courseData.processFlow.map((step) => (
                        <div key={step.title} className="rounded-xl border border-cyan-400/20 bg-white/5 p-4">
                          <p className="text-sm font-semibold text-cyan-200 mb-2">{step.title}</p>
                          <p className="text-sm leading-6 text-slate-200">{step.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-3">Decision Tradeoffs</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {courseData.decisionFrames.map((frame) => (
                          <div key={frame.title} className="rounded-xl border border-emerald-400/20 bg-white/5 p-4">
                            <p className="text-sm font-semibold text-emerald-200 mb-2">{frame.title}</p>
                            <p className="text-sm leading-6 text-slate-200">{frame.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-indigo-300/80 mb-3">Scenario Snapshots</p>
                      <div className="grid gap-3">
                        {courseData.scenarioSnapshots.map((scenario) => (
                          <div key={scenario.title} className="rounded-xl border border-indigo-400/20 bg-white/5 p-4">
                            <p className="text-sm font-semibold text-indigo-200 mb-2">{scenario.title}</p>
                            <p className="text-sm leading-6 text-slate-200">{scenario.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-rose-300/80 mb-3">Common Pitfalls</p>
                      <ul className="space-y-2">
                        {courseData.commonPitfalls.map((pitfall) => (
                          <li key={pitfall} className="text-sm leading-6 text-slate-200">
                            {pitfall}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-3">Failure Signals</p>
                      <ul className="space-y-2">
                        {courseData.failureSignals.map((signal) => (
                          <li key={signal} className="text-sm leading-6 text-slate-200">
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#13233b] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-300/80 mb-3">Deep-Dive Questions</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {courseData.deepDiveQuestions.map((question) => (
                        <div key={question} className="rounded-xl border border-sky-400/20 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                          {question}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 mt-4">
                  <button
                    onClick={() => speakText(courseData.notes.join(' '))}
                    className="px-4 py-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-medium hover:bg-cyan-500/25 transition-all"
                  >
                    Replay Narrator
                  </button>
                  <button
                    onClick={handleNarratorComplete}
                    disabled={!narratorReady}
                    className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  >
                    {narratorReady ? 'Proceed to Q&A' : 'Wait for reading time to finish'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5h4V7h2v5h4l-5 5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">🎙️ AI Narrator</h2>
                <p className="text-gray-300 text-sm">Your lesson is being narrated. Listen carefully.</p>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-6">
              <h3 className="text-xl font-bold text-violet-200 mb-3">TOPIC & SUBTOPIC CONTENT</h3>
              <p className="text-slate-300 text-sm mb-2">This page is dedicated to one whole topic (no cards, one page at a time).</p>
              <p className="text-slate-300 text-sm mb-2">
                Planned study time: {formatDuration(narratorTotalSeconds)}
              </p>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                <div
                  className="h-2 bg-cyan-500"
                  style={{ width: `${narratorProgressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-300 mb-4">{formatDuration(narratorSeconds)} / {formatDuration(narratorTotalSeconds)} read</p>
              <div className="space-y-2">
                {courseData.sections.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="rounded-lg border border-white/10 bg-[#11243f] p-4">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-2">{section.title}</h4>
                    <ul className="list-disc list-inside text-slate-200">
                      {section.subtopics.map((subtopic, subIdx) => (
                        <li key={subIdx} className="mb-1">
                          <strong className="text-slate-100">{subtopic.title}:</strong> {subtopic.content.join(' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* TOPIC HEADING WITH NUMBER */}
            <div className="mb-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-3 font-bold">
                TOPIC {chapterNumber}{sessionLabels.length ? ` OF ${sessionLabels.length}` : ''}
              </p>
              <h3 className="text-3xl font-bold text-white mb-3">{courseData.title}</h3>
              <div className="border-t border-cyan-400/20 pt-4">
                <p className="text-sm text-slate-300 italic">
                  This session is structured in academic detail: Definition, Characteristics, Functions, Types/Applications, 
                  Learning Objectives, Detailed Content Analysis, Concepts, Practice Work, Background Resources, 
                  Worked Examples, Summary Points, and Assessment Preparation.
                </p>
              </div>
            </div>

            {/* 1. DEFINITION SECTION - COMPLEX */}
            <div className="mb-8 rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
              <h4 className="text-xl font-bold text-blue-300 mb-4">1. DEFINITION OF {courseData.title.toUpperCase()}</h4>
              <div className="space-y-4">
                {courseData.notes.slice(0, Math.ceil(courseData.notes.length / 5)).map((note, idx) => (
                  <div key={idx} className="bg-[#13233b] rounded-lg p-4 border-l-4 border-blue-400/50">
                    <p className="text-sm leading-relaxed text-slate-100">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. CHARACTERISTICS SECTION - COMPLEX */}
            <div className="mb-8 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-6">
              <h4 className="text-xl font-bold text-emerald-300 mb-4">2. CHARACTERISTICS OF {courseData.title.toUpperCase()}</h4>
              <div className="space-y-3">
                {courseData.notes.slice(Math.ceil(courseData.notes.length / 5), Math.ceil((courseData.notes.length * 2) / 5)).map((note, idx) => (
                  <div key={idx} className="bg-[#13233b] rounded-lg p-4 border-l-4 border-emerald-400/50">
                    <span className="font-bold text-emerald-300">{idx + 1}.</span>
                    <p className="text-sm leading-relaxed text-slate-100 ml-4 -mt-5">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. FUNCTIONS SECTION - COMPLEX */}
            <div className="mb-8 rounded-xl border border-rose-400/30 bg-rose-500/10 p-6">
              <h4 className="text-xl font-bold text-rose-300 mb-4">3. FUNCTIONS OF {courseData.title.toUpperCase()}</h4>
              <div className="space-y-3">
                {courseData.notes.slice(Math.ceil((courseData.notes.length * 2) / 5), Math.ceil((courseData.notes.length * 3) / 5)).map((note, idx) => (
                  <div key={idx} className="bg-[#13233b] rounded-lg p-4 border-l-4 border-rose-400/50">
                    <span className="font-bold text-rose-300">{idx + 1}.</span>
                    <p className="text-sm leading-relaxed text-slate-100 ml-4 -mt-5">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. TYPES & APPLICATIONS SECTION - COMPLEX */}
            <div className="mb-8 rounded-xl border border-amber-400/30 bg-amber-500/10 p-6">
              <h4 className="text-xl font-bold text-amber-300 mb-4">4. TYPES AND APPLICATIONS OF {courseData.title.toUpperCase()}</h4>
              <div className="space-y-3">
                {courseData.notes.slice(Math.ceil((courseData.notes.length * 3) / 5), Math.ceil((courseData.notes.length * 4) / 5)).map((note, idx) => (
                  <div key={idx} className="bg-[#13233b] rounded-lg p-4 border-l-4 border-amber-400/50">
                    <span className="font-bold text-amber-300">{idx + 1}.</span>
                    <p className="text-sm leading-relaxed text-slate-100 ml-4 -mt-5">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. ADVANCED TOPICS SECTION */}
            <div className="mb-8 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-6">
              <h4 className="text-xl font-bold text-indigo-300 mb-4">5. ADVANCED TOPICS AND APPLICATIONS</h4>
              <div className="space-y-3">
                {courseData.notes.slice(Math.ceil((courseData.notes.length * 4) / 5)).map((note, idx) => (
                  <div key={idx} className="bg-[#13233b] rounded-lg p-4 border-l-4 border-indigo-400/50">
                    <span className="font-bold text-indigo-300">{idx + 1}.</span>
                    <p className="text-sm leading-relaxed text-slate-100 ml-4 -mt-5">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. LEARNING OBJECTIVES - DETAILED */}
            <div className="mb-8 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-6">
              <h4 className="text-xl font-bold text-emerald-300 mb-4">6. LEARNING OBJECTIVES AND OUTCOMES</h4>
              <div className="space-y-3">
                {courseData.learningObjectives.map((objective, idx) => (
                  <div key={idx} className="bg-[#13233b] rounded-lg p-4 border-l-4 border-emerald-400/50">
                    <p className="text-sm leading-relaxed text-slate-100">
                      <span className="font-bold text-emerald-300">Objective {idx + 1}:</span> {objective}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. DETAILED CONTENT SECTIONS & SUBTOPICS */}
            <div className="mb-8">
              <h4 className="text-xl font-bold text-cyan-300 mb-4">7. DETAILED CONTENT ANALYSIS AND SUBTOPICS</h4>
              <div className="space-y-4">
                {courseData.sections.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-6">
                    <h5 className="text-lg font-semibold text-cyan-200 mb-4">Section {sectionIdx + 1}: {section.title}</h5>
                    <div className="space-y-3">
                      {section.subtopics.map((subtopic, subtopicIdx) => (
                        <div key={subtopicIdx} className="rounded-lg border border-cyan-400/20 bg-[#13233b] p-4">
                          <h6 className="text-sm font-bold text-cyan-300 mb-3 uppercase">Subtopic {subtopicIdx + 1}: {subtopic.title}</h6>
                          <div className="space-y-2 ml-4">
                            {subtopic.content.map((item, itemIdx) => (
                              <div key={itemIdx} className="text-xs leading-relaxed text-slate-200">
                                <span className="font-semibold text-cyan-200">{String.fromCharCode(97 + itemIdx)})</span> {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. KEY CONCEPTS & TERMINOLOGY */}
            <div className="mb-8 rounded-xl border border-violet-400/30 bg-violet-500/10 p-6">
              <h4 className="text-xl font-bold text-violet-300 mb-4">8. KEY CONCEPTS AND TERMINOLOGY</h4>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {courseData.keyTerms.map((term, idx) => (
                  <div key={idx} className="rounded-lg border border-violet-400/20 bg-[#13233b] p-4">
                    <span className="font-bold text-violet-300 text-sm">{idx + 1}. {term}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 9. PRACTICE WORK & LAB ACTIVITIES */}
            <div className="mb-8 rounded-xl border border-amber-400/30 bg-amber-500/10 p-6">
              <h4 className="text-xl font-bold text-amber-300 mb-4">9. PRACTICE WORK AND LAB ACTIVITIES</h4>
              <div className="space-y-3">
                {courseData.practiceTasks.map((task, idx) => (
                  <div key={idx} className="rounded-lg border border-amber-400/20 bg-[#13233b] p-4">
                    <p className="text-sm leading-relaxed text-slate-100">
                      <span className="font-bold text-amber-300">Activity {idx + 1}:</span> {task}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 10. BACKGROUND READING & RESOURCES */}
            <div className="mb-8 rounded-xl border border-sky-400/30 bg-sky-500/10 p-6">
              <h4 className="text-xl font-bold text-sky-300 mb-4">10. BACKGROUND READING AND RECOMMENDED RESOURCES</h4>
              <div className="space-y-3">
                {courseData.background.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-sky-400/20 bg-[#13233b] p-4">
                    <p className="text-sm leading-relaxed text-slate-100">
                      <span className="font-bold text-sky-300">Resource {idx + 1}:</span> {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 11. WORKED EXAMPLES & CASE STUDIES */}
            <div className="mb-8 rounded-xl border border-rose-400/30 bg-rose-500/10 p-6">
              <h4 className="text-xl font-bold text-rose-300 mb-4">11. WORKED EXAMPLES AND CASE STUDIES</h4>
              <div className="space-y-3">
                {courseData.workedExample.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-rose-400/20 bg-[#13233b] p-4">
                    <p className="text-sm leading-relaxed text-slate-100">
                      <span className="font-bold text-rose-300">Example {idx + 1}:</span> {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 12. SESSION SUMMARY & KEY POINTS */}
            <div className="mb-8 rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
              <h4 className="text-xl font-bold text-blue-300 mb-4">12. SESSION SUMMARY AND KEY TAKEAWAYS</h4>
              <div className="space-y-3">
                {courseData.summaryPoints.map((point, idx) => (
                  <div key={idx} className="rounded-lg border border-blue-400/20 bg-[#13233b] p-4 flex gap-3">
                    <span className="font-bold text-blue-300 flex-shrink-0">✓</span>
                    <p className="text-sm leading-relaxed text-slate-100">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 13. ASSESSMENT PREPARATION & TEST TIPS */}
            <div className="mb-8 rounded-xl border border-orange-400/30 bg-orange-500/10 p-6">
              <h4 className="text-xl font-bold text-orange-300 mb-4">13. ASSESSMENT PREPARATION AND STUDY TIPS</h4>
              <div className="space-y-3">
                {courseData.shortTestTips.map((tip, idx) => (
                  <div key={idx} className="rounded-lg border border-orange-400/20 bg-[#13233b] p-4">
                    <p className="text-sm leading-relaxed text-slate-100">
                      <span className="font-bold text-orange-300">Tip {idx + 1}:</span> {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => speakText(courseData.notes.join(' '))}
                className="flex-1 px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-medium hover:bg-cyan-500/30 transition-all"
              >
                🔊 Re-play Narrator
              </button>
              <button
                onClick={handleNarratorComplete}
                disabled={!narratorReady}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                {narratorReady ? 'Proceed to Q&A →' : 'Proceed after reading completes'}
              </button>
            </div>
          </div>
          )
        )}

        {/* Q&A PHASE */}
        {phase === 'qa' && (
          <div className="bg-white/5 border border-violet-500/30 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">❓ Session Q&A</h2>
            <div className="space-y-6 mb-8">
              {courseData.qaQuestions.map((q, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white font-medium mb-4">{idx + 1}. {q.q}</p>
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`qa-${idx}`}
                          value={optIdx}
                          checked={qaAnswers[idx] === optIdx}
                          onChange={() => setQaAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleQASubmit}
              disabled={!narratorReady || Object.keys(qaAnswers).length < courseData.qaQuestions.length}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {'Proceed to Topic Quiz ->'}
            </button>
          </div>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && (
          <div className="bg-white/5 border border-green-500/30 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Topic Quiz</h2>
            <p className="text-gray-400 mb-6">Answer these questions before moving to the next topic.</p>
            <div className="space-y-6 mb-8">
              {courseData.quizQuestions.map((q, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white font-medium mb-4">{idx + 1}. {q.q}</p>
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`quiz-${idx}`}
                          value={optIdx}
                          checked={quizAnswers[idx] === optIdx}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleQuizSubmit}
              disabled={savingAssessment || !readTimeCompletedAt || Object.keys(quizAnswers).length < courseData.quizQuestions.length}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all disabled:cursor-not-allowed"
            >
              {savingAssessment ? 'Saving Topic Quiz...' : 'Submit Topic Quiz'}
            </button>
          </div>
        )}

        {/* COMPLETION PHASE */}
        {phase === 'complete' && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-green-300 mb-3">Topic Quiz Submitted</h2>
            <p className="text-green-200 mb-2">Topic {chapterNumber} has been completed successfully.</p>
            <p className="text-green-100/70 mb-8">Your score has been recorded and you can continue to the next topic in the {course} course.</p>

            {currentTopicResult && (
              <div className="mx-auto mb-8 max-w-md rounded-2xl border border-white/10 bg-[#0d2038] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-green-300/80 mb-2">Recorded Score</p>
                <p className="text-4xl font-bold text-white">{currentTopicResult.score}%</p>
                <p className="text-sm text-slate-300 mt-2">{currentTopicResult.correct} out of {currentTopicResult.total} answers were correct.</p>
              </div>
            )}

            <div className={`grid gap-4 ${nextSessionLabel ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <button
                onClick={restartCurrentTopic}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
              >
                Review Topic Again
              </button>
              {nextSessionLabel && (
                <button
                  onClick={handleNextSession}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-all"
                >
                  Proceed to {nextSessionLabel}
                </button>
              )}
              <button
                onClick={goToDashboard}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {phase === 'course-summary' && (
          <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-8 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">All Topic Quiz Scores</h2>
            <p className="text-slate-300 mb-8">
              Topic {chapterNumber} has been submitted. Review every topic score below before proceeding to the final exam.
            </p>

            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <div className="rounded-2xl border border-white/10 bg-[#11243f] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">Completed Topic Quizzes</p>
                <p className="text-3xl font-bold text-white">{completedTopicCount}/{sessionLabels.length}</p>
                <p className="text-sm text-slate-300 mt-2">Every topic needs a recorded quiz score before the final exam unlocks.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11243f] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Average Topic Score</p>
                <p className="text-3xl font-bold text-white">{topicAverageScore}%</p>
                <p className="text-sm text-slate-300 mt-2">This is the average across all completed topic quizzes.</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {orderedTopicResults.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-[#11243f] p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">
                      {item.result ? `${item.result.correct}/${item.result.total} correct` : 'Quiz not completed yet'}
                    </p>
                  </div>
                  <div className={`rounded-full px-4 py-2 text-sm font-bold ${item.result ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                    {item.result ? `${item.result.score}%` : 'Incomplete'}
                  </div>
                </div>
              ))}
            </div>

            <div className={`grid gap-4 ${allTopicQuizzesComplete || firstIncompleteSession ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
              <button
                onClick={goToDashboard}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
              >
                Back to Dashboard
              </button>
              {allTopicQuizzesComplete ? (
                <button
                  onClick={handleStartFinalExam}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-all"
                >
                  Proceed to Final Exam (100 Marks)
                </button>
              ) : firstIncompleteSession ? (
                <button
                  onClick={() => goToSession(firstIncompleteSession)}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:opacity-90 transition-all"
                >
                  Go to First Incomplete Topic
                </button>
              ) : null}
            </div>
          </div>
        )}

        {phase === 'final-exam' && (
          <div className="bg-white/5 border border-amber-500/30 rounded-2xl p-8 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Final Exam</h2>
            <p className="text-slate-300 mb-6">
              This exam covers every topic in the course and is graded out of 100.
            </p>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="rounded-xl border border-white/10 bg-[#11243f] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Questions</p>
                <p className="text-2xl font-bold text-white">{finalExamQuestions.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#11243f] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Score Scale</p>
                <p className="text-2xl font-bold text-white">0 - 100</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#11243f] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Coverage</p>
                <p className="text-2xl font-bold text-white">{sessionLabels.length} Topics</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {finalExamQuestions.map((q, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white font-medium mb-4">{idx + 1}. {q.q}</p>
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`final-${idx}`}
                          value={optIdx}
                          checked={finalExamAnswers[idx] === optIdx}
                          onChange={() => setFinalExamAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setPhase('course-summary')}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
              >
                Back to Topic Scores
              </button>
              <button
                onClick={handleFinalExamSubmit}
                disabled={savingAssessment || Object.keys(finalExamAnswers).length < finalExamQuestions.length}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all disabled:cursor-not-allowed"
              >
                {savingAssessment ? 'Saving Final Exam...' : 'Submit Final Exam'}
              </button>
            </div>
          </div>
        )}

        {phase === 'final-result' && finalExamResult && (
          <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-300">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-emerald-200 mb-3">Final Exam Submitted</h2>
            <p className="text-emerald-100 mb-8">The course has been completed and your final exam score is now recorded.</p>

            <div className="mx-auto mb-8 max-w-2xl grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0d2038] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Final Exam Score</p>
                <p className="text-4xl font-bold text-white">{finalExamResult.score}/100</p>
                <p className="text-sm text-slate-300 mt-2">{finalExamResult.correct}/{finalExamResult.total} correct</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0d2038] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">Topic Average</p>
                <p className="text-4xl font-bold text-white">{topicAverageScore}%</p>
                <p className="text-sm text-slate-300 mt-2">Across all topic quizzes</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0d2038] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Topic Quizzes</p>
                <p className="text-4xl font-bold text-white">{completedTopicCount}/{sessionLabels.length}</p>
                <p className="text-sm text-slate-300 mt-2">Completed topic assessments</p>
              </div>
            </div>

            <div className="space-y-3 mb-8 text-left">
              {orderedTopicResults.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-[#11243f] p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">
                      {item.result ? `${item.result.correct}/${item.result.total} correct` : 'Not completed'}
                    </p>
                  </div>
                  <div className={`rounded-full px-4 py-2 text-sm font-bold ${item.result ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                    {item.result ? `${item.result.score}%` : 'Incomplete'}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setPhase('course-summary')}
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
              >
                Review Topic Scores
              </button>
              <button
                onClick={goToDashboard}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lesson;
