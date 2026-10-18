// Replace these placeholders before launch. Empty URLs are deliberately hidden.
export const profile = {
  name: 'Jacob Routzong',
  initials: 'JR',
  headline: 'Intelligence, engineered.',
  role: 'AI / ML · Data · Systems',
  introduction: 'Exploring the intersection of intelligent models, complex data, and the systems that bring them to life.',
  bio: 'Add your professional introduction here: what you study, what you build, and the engineering problems you want to solve.',
  location: '',
  email: '',
  resume: '', // e.g. /resume.pdf — put the real file in public/
  githubUsername: 'jacobhroutzong',
  challengeRepository: '', // https://github.com/YOUR_USERNAME/coding-challenges
  social: { github: 'https://github.com/jacobhroutzong', huggingface: 'https://huggingface.co/jacobroutzong', linkedin: 'https://www.linkedin.com/in/jacobroutzong/', youtube: '', x: '' },
  skills: ['Python', 'SQL', 'Machine learning', 'Data engineering', 'Simulation', 'GPU computing'],
  experience: [] as { title: string; organization: string; period: string; description: string }[],
  education: [] as { title: string; organization: string; period: string; description: string }[],
  configured: false, // Set true after replacing the placeholder profile.
};

export const socialLinks = Object.entries(profile.social)
  .filter(([, url]) => url.startsWith('https://'))
  .map(([key, url]) => ({ key, url, label: ({ github: 'GitHub', huggingface: 'Hugging Face', linkedin: 'LinkedIn', youtube: 'YouTube', x: 'X' } as Record<string, string>)[key] }));

export const specializations = [
  { number: '01', title: 'AI & Machine Learning', short: 'Models that learn. Systems that reason.', description: 'Predictive modeling, reinforcement learning, and intelligent applications.', category: 'AI / Machine Learning', icon: 'network' },
  { number: '02', title: 'Data Engineering', short: 'From raw signals to useful decisions.', description: 'Reliable pipelines, analytics, and data-intensive systems.', category: 'Data Engineering', icon: 'layers' },
  { number: '03', title: 'Robotics & Simulation', short: 'Intelligence meets the physical world.', description: 'Control, simulation environments, and embodied learning.', category: 'Robotics & Simulation', icon: 'orbit' },
  { number: '04', title: 'Quantitative Research', short: 'Hypotheses, experiments, evidence.', description: 'Forecasting, numerical methods, and reproducible research.', category: 'Quantitative Research', icon: 'chart' },
  { number: '05', title: 'GPU & Systems', short: 'Closer to the hardware. Further in scale.', description: 'Parallel computing, kernel development, and performance optimization.', category: 'GPU / High-Performance Computing', icon: 'chip' },
  { number: '06', title: 'Signals & Security', short: 'Understanding information in motion.', description: 'Public, independently developed signal-processing and security research.', category: 'Signal Processing / Electronic Warfare', icon: 'wave' },
];
