import type {
  DemoStudentData,
  DemoActivityEvent,
  DemoChecklistItem,
  DemoNotification,
} from './types.ts'

export const DEMO_STUDENT: DemoStudentData = {
  id: 'std_demo_9281',
  name: 'Alex Morgan',
  handle: 'alexmorgan.dev',
  avatarInitials: 'AM',
  role: 'Full-Stack & Systems Engineer',
  institution: 'School of Computer Science',
  location: 'San Francisco, CA',
  bio: 'Building distributed systems, agentic workflows, and high-performance web applications with TypeScript, React, and Python.',
  cohort: '',
  skills: [
    'TypeScript',
    'React',
    'Next.js',
    'Python',
    'FastAPI',
    'PostgreSQL',
    'Docker',
    'Tailwind CSS',
    'Git',
  ],
  completion: {
    profile: 100,
    resume: 85,
    portfolio: 60,
    projects: 75,
  },
  domainInfo: {
    handle: 'alexmorgan.dev',
    tld: '.xyz',
    status: 'In Review',
    isVoucherEligible: false,
    dnsTarget: 'cname.kaizenq.me',
  },
}

export const DEMO_ACTIVITIES: DemoActivityEvent[] = [
  {
    id: 'act_1',
    title: 'ATS Resume Keyword Optimization',
    description: 'ATS engine validated layout matching full-stack engineering criteria.',
    timestamp: '2 hours ago',
    category: 'resume',
    iconType: 'file',
  },
  {
    id: 'act_2',
    title: 'Project Repository Synchronized',
    description: 'Synced NeuralTrace from GitHub.',
    timestamp: 'Yesterday',
    category: 'project',
    iconType: 'git',
  },
  {
    id: 'act_3',
    title: 'Hackathon Credential Verified',
    description: 'Verified Top 10 Builder credential status.',
    timestamp: '3 days ago',
    category: 'credential',
    iconType: 'award',
  },
  {
    id: 'act_4',
    title: 'Domain Connection Submitted',
    description: 'Submitted DNS records for alexmorgan.dev.',
    timestamp: '5 days ago',
    category: 'domain',
    iconType: 'compass',
  },
]

export const DEMO_CHECKLIST: DemoChecklistItem[] = [
  {
    id: 'chk_1',
    title: 'Complete Personal Bio & Tech Stack',
    description: 'Provide an impactful headline, short bio, and verified core skills.',
    completed: true,
  },
  {
    id: 'chk_2',
    title: 'Link Active Project Repositories',
    description: 'Attach GitHub repositories and verify production demo URLs.',
    completed: true,
  },
  {
    id: 'chk_3',
    title: 'Fine-tune ATS Resume Summary',
    description: 'Add a target objective to reach 100% resume readiness.',
    completed: false,
    actionLabel: 'Edit Resume',
    targetTab: 'resume',
  },
  {
    id: 'chk_4',
    title: 'Publish Portfolio Website',
    description: 'Review project cards and toggle your portfolio to published mode.',
    completed: false,
    actionLabel: 'Review Portfolio',
    targetTab: 'portfolio',
  },
  {
    id: 'chk_5',
    title: 'Verify Custom Domain DNS',
    description: 'Confirm CNAME verification record for alexmorgan.dev.',
    completed: false,
    actionLabel: 'Configure DNS',
    targetTab: 'domain',
  },
]

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'notif_1',
    title: 'ATS Resume Updated',
    message: 'Your resume layout is saved and ready for export.',
    timestamp: '2h ago',
    read: false,
    type: 'success',
  },
  {
    id: 'notif_2',
    title: 'Cloud Persistence Active',
    message: 'Your documents and drafts are safely synced to Supabase.',
    timestamp: '1d ago',
    read: false,
    type: 'info',
  },
  {
    id: 'notif_3',
    title: 'Domain Configuration',
    message: 'CNAME records pending verification.',
    timestamp: '3d ago',
    read: true,
    type: 'info',
  },
]
