import type { ResumeData } from './types.ts'

export const DEFAULT_EMPTY_RESUME: ResumeData = {
  version: 1,
  id: 'resume_default',
  title: 'My Professional Resume',
  template: 'classic-ats',
  updatedAt: new Date().toISOString(),
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    summary: '',
  },
  education: [],
  skills: {
    languages: [],
    frameworks: [],
    tools: [],
    softSkills: [],
  },
  projects: [],
  experience: [],
  certifications: [],
  additional: {
    achievements: [],
    coursework: [],
    languages: [],
  },
  visibleSections: {
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    certifications: true,
    additional: true,
  },
}

export const SAMPLE_RESUME_DATA: ResumeData = {
  version: 1,
  id: 'resume_demo_rahul',
  title: 'Full-Stack Software Engineer Resume',
  template: 'classic-ats',
  updatedAt: new Date().toISOString(),
  personalInfo: {
    fullName: 'Rahul Sharma',
    title: 'Full-Stack & Systems Engineer',
    email: 'rahul.sharma@example.edu',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    linkedinUrl: 'https://linkedin.com/in/rahul-sharma',
    githubUrl: 'https://github.com/rahul-dev',
    portfolioUrl: 'https://rahul.xyz',
    summary:
      'Passionate Software Engineer with expertise in TypeScript, React, Python, and distributed systems. Track record of developing high-performance web applications and latency profiling architectures. Recognized Top 10 Builder at National Engineering Hackathon.',
  },
  education: [
    {
      id: 'edu_1',
      institution: 'Bangalore Institute of Technology',
      degree: 'Bachelor of Technology',
      fieldOfStudy: 'Computer Science & Engineering',
      startDate: '2022',
      endDate: '2026',
      grade: '8.9 / 10 CGPA',
    },
  ],
  skills: {
    languages: ['TypeScript', 'JavaScript', 'Python', 'Go', 'SQL', 'C++'],
    frameworks: ['React', 'Next.js', 'FastAPI', 'Node.js', 'Tailwind CSS', 'Express'],
    tools: ['Docker', 'PostgreSQL', 'Redis', 'Git', 'Linux', 'Vite', 'GraphQL'],
    softSkills: ['System Design', 'Technical Writing', 'Pair Programming', 'Agile Sprints'],
  },
  projects: [
    {
      id: 'proj_1',
      name: 'NeuralTrace — Distributed Latency Profiler',
      description:
        'Architected an open-source evaluation and telemetry engine for LLM pipelines, achieving sub-10ms profiling overhead across concurrent worker nodes.',
      technologies: ['Python', 'FastAPI', 'Redis', 'Docker'],
      projectUrl: 'https://neuraltrace.rahul.xyz',
      githubUrl: 'https://github.com/rahul-dev/neuraltrace',
    },
    {
      id: 'proj_2',
      name: 'HyperCanvas — Real-time CRDT Whiteboard',
      description:
        'Engineered a multi-user collaborative canvas implementing conflict-free replicated data types (CRDT) for millisecond state synchronization.',
      technologies: ['TypeScript', 'React', 'WebSockets', 'Canvas API'],
      projectUrl: 'https://canvas.rahul.xyz',
      githubUrl: 'https://github.com/rahul-dev/hypercanvas',
    },
  ],
  experience: [
    {
      id: 'exp_1',
      organization: 'KaizenQ Engineering Fellowship',
      role: 'Full-Stack Engineering Intern',
      startDate: 'Jan 2025',
      endDate: 'Present',
      bullets: [
        'Designed modular React and TypeScript components reducing frontend bundle footprint by 28%.',
        'Implemented Edge DNS allocation telemetry and automated SSL provisioning workflows.',
        'Collaborated on ATS resume parsing heuristics achieving 98% structural accuracy.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert_1',
      name: 'National Hackathon Top 10 Builder Credential',
      issuer: 'Engineering Innovation Forum',
      issueDate: '2026',
      credentialUrl: 'https://verify.kaizenq.id/cert/hackathon-089',
    },
    {
      id: 'cert_2',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: '2025',
      credentialUrl: 'https://aws.amazon.com/verification',
    },
  ],
  additional: {
    achievements: [
      'Ranked in Top 1% of 350+ university builders at National Engineering Hackathon.',
      'Authored open-source profiling libraries with over 200 cumulative GitHub stars.',
    ],
    coursework: ['Data Structures & Algorithms', 'Operating Systems', 'Database Systems', 'Computer Networks'],
    languages: ['English (Fluent)', 'Hindi (Native)', 'Kannada (Conversational)'],
  },
  visibleSections: {
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    certifications: true,
    additional: true,
  },
}
