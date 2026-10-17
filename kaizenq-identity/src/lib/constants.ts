/**
 * KaizenQ Identity — Application Constants
 * Shaivika Groups × KaizenQ | Student Professional Identity Platform
 */

export const SITE_CONFIG = {
  name: 'KaizenQ Identity',
  shortName: 'KaizenQ',
  brandPartner: 'Shaivika Groups',
  collaborationText: 'Shaivika Groups × KaizenQ',
  tagline: 'Your Skills. Your Story. Your Digital Identity.',
  description:
    'Create a professional resume, showcase your projects, and build a portfolio you can share with the world.',
  version: '1.0.0',
  cohortSize: '350 Participants Rollout',
  eventTag: 'Shaivika Groups × KaizenQ • FUSION 2K26',
  links: {
    github: 'https://github.com/kaizenq',
    twitter: 'https://twitter.com/kaizenq_id',
    discord: 'https://discord.gg/kaizenq',
  },
} as const

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Portfolio Preview', href: '#preview' },
  { label: 'Templates', href: '#templates' },
  { label: 'Domains', href: '#domains' },
  { label: 'FUSION 2K26', href: '#fusion-2k26' },
] as const

export interface FeatureItem {
  id: string
  title: string
  description: string
  iconName: 'FileText' | 'Globe' | 'GitBranch' | 'Award' | 'QrCode' | 'Sparkles' | 'Bot'
  badge?: string
  highlights: string[]
}

export const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'resume',
    title: 'Professional Resume',
    description:
      'Engineered for ATS compliance and recruiter readability with LaTeX-grade typography and structured formatting.',
    iconName: 'FileText',
    badge: 'ATS-Optimized',
    highlights: ['Single-page & multi-page layouts', 'Instant PDF-ready structure', 'Keyword relevance hierarchy'],
  },
  {
    id: 'portfolio',
    title: 'Personal Portfolio',
    description:
      'Turn your profile into a blazing fast, responsive portfolio without writing boilerplate or configuring servers.',
    iconName: 'Globe',
    badge: 'Responsive Web',
    highlights: ['Curated dark & minimal aesthetics', 'Interactive project embeds', 'Sub-second page speeds'],
  },
  {
    id: 'projects',
    title: 'Project Showcase',
    description:
      'Highlight your best GitHub repositories, tech stacks, live demos, and verified project contributions.',
    iconName: 'GitBranch',
    badge: 'Live Demos',
    highlights: ['Automated tech stack categorization', 'Repository metrics and stars', 'Live demo and README links'],
  },
  {
    id: 'shareable-profile',
    title: 'Shareable Profile',
    description:
      'Distribute your verified student profile via a clean public URL or high-resolution scannable QR card.',
    iconName: 'QrCode',
    badge: 'Recruiter Ready',
    highlights: ['One-tap scannable QR cards', 'Direct portfolio web link', 'Tamper-evident student verification'],
  },
  {
    id: 'xyz-domain',
    title: 'Custom Domain Support',
    description:
      'Personal .xyz handle routing workflow prepared for eligible bootcamp and FUSION 2K26 participants.',
    iconName: 'Sparkles',
    badge: 'Cohort Workflow',
    highlights: ['Automated edge DNS routing preview', 'Personal builder handle workflow', 'SSL certificate architecture'],
  },
  {
    id: 'ai-assistance',
    title: 'Future AI Assistance',
    description:
      'Architected for upcoming AI-assisted bullet point polishing, skills gap analysis, and tailored role recommendations.',
    iconName: 'Award',
    badge: 'Next Phase',
    highlights: ['Context-aware accomplishment phrasing', 'ATS keyword density audit', 'Role-specific portfolio tuning'],
  },
]

export interface StepItem {
  number: string
  title: string
  description: string
  detail: string
}

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Build your profile',
    description: 'Input your academic background, technical skills, project links, and hackathon accomplishments.',
    detail: 'Fast structured form input designed specifically for engineering students.',
  },
  {
    number: '02',
    title: 'Create your resume and portfolio',
    description: 'Select a curated engineering layout tailored for typography balance and instant readability.',
    detail: 'Simultaneously generates an ATS-grade resume and a live interactive web portfolio.',
  },
  {
    number: '03',
    title: 'Publish and share your professional identity',
    description: 'Share your verified public portfolio URL, download your resume, and connect your .xyz handle.',
    detail: 'Distribute via QR code cards, LinkedIn, and recruiter applications worldwide.',
  },
]

export interface TemplateItem {
  id: string
  name: string
  tag: string
  description: string
  accentColor: string
  recommendedFor: string
  features: string[]
}

export const TEMPLATES_DATA: TemplateItem[] = [
  {
    id: 'minimal-mono',
    name: 'Obsidian Minimal',
    tag: 'Popular',
    description: 'Ultra-clean deep navy typography with crisp lines inspired by Linear and developer documentation.',
    accentColor: '#4F8CFF',
    recommendedFor: 'Backend & Systems Engineers',
    features: ['Terminal aesthetic headers', 'Compact project list', 'High contrast readability'],
  },
  {
    id: 'modern-craft',
    name: 'Kinetic Studio',
    tag: 'Design-Forward',
    description: 'Subtle motion accents, interactive project tiles, and visual media showcase.',
    accentColor: '#8CD8FF',
    recommendedFor: 'Full-Stack & Frontend Crafters',
    features: ['Fluid hover states', 'Interactive code previews', 'Media gallery integration'],
  },
  {
    id: 'academic-scholar',
    name: 'Vanguard Scholar',
    tag: 'Research',
    description: 'Structured layout emphasizing research papers, university milestones, and academic awards.',
    accentColor: '#DCEBFF',
    recommendedFor: 'ML Researchers & Postgraduates',
    features: ['Citation badges', 'Publication bibliography', 'Advisor endorsement links'],
  },
]

export const MOCK_STUDENT_PREVIEW = {
  name: 'Alex Morgan',
  handle: 'alexmorgan.dev',
  role: 'Full-Stack & Systems Engineer',
  institution: 'School of Computer Science',
  location: 'San Francisco, CA',
  bio: 'Building distributed systems, agentic workflows, and high-performance web applications.',
  githubUrl: 'https://github.com/alex-dev',
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
  projects: [
    {
      title: 'NeuralTrace',
      tagline: 'Distributed LLM evaluation and latency profiling engine',
      stars: 142,
      tags: ['Python', 'FastAPI', 'Redis'],
      metrics: '3.4k Monthly Queries',
    },
    {
      title: 'HyperCanvas',
      tagline: 'Real-time collaborative whiteboard with CRDT conflict resolution',
      stars: 89,
      tags: ['TypeScript', 'WebSockets', 'Canvas API'],
      metrics: '<12ms Sync Latency',
    },
  ],
  certifications: [
    {
      title: 'National Hackathon Top 10 Builder',
      issuer: 'Engineering Innovation Forum',
      date: '2026',
      verified: true,
    },
    {
      title: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: '2025',
      verified: true,
    },
  ],
}
