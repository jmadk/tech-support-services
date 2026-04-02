import { IT_SUPPORT_CUSTOMER_CARE_COURSE } from '@/lib/it-support-course';

const certificationServiceMap: Record<string, string> = {
  [IT_SUPPORT_CUSTOMER_CARE_COURSE.toLowerCase()]: IT_SUPPORT_CUSTOMER_CARE_COURSE,
  'it support & customer care': IT_SUPPORT_CUSTOMER_CARE_COURSE,
  'technical support & maintenance': IT_SUPPORT_CUSTOMER_CARE_COURSE,
  'database systems': 'Database Systems',
  'data science & analytics': 'Database Systems',
  'data communications & networks': 'Data Communications & Networks',
  'distributed systems': 'Distributed Systems',
  'cloud computing & devops': 'Distributed Systems',
  'data structures & algorithms': 'Data Structures & Algorithms',
  'operating systems': 'Operating Systems',
  'software engineering': 'Software Engineering',
  'software development': 'Software Engineering',
  'web development': 'Web Development',
  'web & app development': 'Web Development',
  'computer security': 'Computer Security',
  'cybersecurity': 'Computer Security',
};

export function resolveCertificationCourseTitle(serviceTitle: string | null | undefined) {
  if (!serviceTitle) {
    return null;
  }

  return certificationServiceMap[serviceTitle.trim().toLowerCase()] || null;
}
