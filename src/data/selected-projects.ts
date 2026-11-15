// Oldest first: append newly added projects at the end. Both project lists display newest first within each group.
export const selectedProjects = [
  {
    "title": "Decision Intelligence Engine",
    "group": "research",
    "eyebrow": "AI / MACHINE LEARNING / CASE STUDY",
    "description": "An engineering workbench for inspecting how a system turns telemetry into a decision.",
    "href": "/projects/decision-intelligence-engine/",
    "linkLabel": "Explore Decision Intelligence Engine →"
  },
  {
    "title": "Ascent — AI Lab Preparation",
    "group": "research",
    "eyebrow": "PYTHON / MACHINE LEARNING / FROM SCRATCH",
    "description": "A local-first workspace for studying machine learning and practicing technical reasoning.",
    "href": "/projects/ascent/",
    "linkLabel": "Explore Ascent →"
  },
  {
    "title": "Harness² Lab",
    "group": "research",
    "eyebrow": "PYTHON / AGENT SYSTEMS / INTERACTIVE LAB",
    "description": "Explore recursive agent harnessing through live execution traces, a reusable harness library, and adaptive compute budget experiments.",
    "href": "/projects/harness2-lab/",
    "linkLabel": "Explore project & app →"
  },
  {
    "title": "EquityScout",
    "group": "business",
    "eyebrow": "BUSINESS & OPERATIONS SYSTEMS / CASE STUDY",
    "description": "An acquisition research workspace for reviewing evidence and comparing real estate scenarios.",
    "href": "/projects/equityscout/",
    "linkLabel": "Explore EquityScout →"
  },
  {
    "title": "Leverline",
    "group": "business",
    "eyebrow": "BUSINESS & OPERATIONS SYSTEMS / CASE STUDY",
    "description": "An applied AI consulting project for identifying automation opportunities in small businesses.",
    "href": "/projects/leverline/",
    "linkLabel": "Explore Leverline →"
  },
  {
    "title": "Scientific Systems Lab",
    "group": "research",
    "eyebrow": "C++20 / SCIENTIFIC COMPUTING / RESEARCH",
    "description": "Numerical and symbolic engines with traceable investigations, exact mathematics, and independent validation. Explore working subsystems and the seven-project roadmap.",
    "href": "/labs/scientific-systems/",
    "linkLabel": "Explore the lab →"
  },
  {
    "title": "Tunera",
    "group": "research",
    "eyebrow": "PYTHON / MODEL FINE-TUNING",
    "description": "A model development workflow for planning experiments and comparing results.",
    "href": "/projects/tunera/",
    "linkLabel": "Explore Tunera →"
  },
  {
    "title": "Recursa — Recursive Application Synthesis",
    "group": "research",
    "eyebrow": "PYTHON / RECURSIVE INFERENCE / RESEARCH IN PROGRESS",
    "description": "Inspect the progress of an application-synthesis research workbench: external requirements, dependency-aware plans, saved artifacts, and clearly labeled execution evidence.",
    "href": "/projects/recursa/",
    "linkLabel": "Explore Recursa & progress →"
  },
  {
    "title": "Lintel",
    "group": "business",
    "eyebrow": "BUSINESS & OPERATIONS SYSTEMS / CASE STUDY",
    "description": "A smart-home planning project that connects homeowner goals to a practical installation plan.",
    "href": "/projects/lintel/",
    "linkLabel": "Explore Lintel →"
  },
  {
    "title": "Pursuit",
    "group": "research",
    "eyebrow": "WEB APPLICATION / WORKFLOW AUTOMATION",
    "description": "Review job recommendations one at a time, save roles worth a closer look, and track applications. Try the workflow with three sample jobs.",
    "href": "/projects/pursuit/",
    "linkLabel": "Explore Pursuit →"
  },
  {
    "title": "Convergence",
    "group": "business",
    "eyebrow": "BUSINESS & OPERATIONS SYSTEMS / CASE STUDY",
    "description": "A CRM and operations workspace that connects customer relationships with work in progress.",
    "href": "/projects/convergence/",
    "linkLabel": "Explore Convergence →"
  },
  {
    "title": "Q-SPECTRA // Universal Quantum Home & Simulation Platform",
    "group": "research",
    "homeTitle": "Q-SPECTRA",
    "eyebrow": "QUANTUM SENSING / COMPUTING / CRYPTOGRAPHY",
    "description": "Explore quantum sensing, build quantum circuits, and simulate BB84 key distribution in your browser.",
    "href": "/projects/q-spectra/",
    "linkLabel": "Explore Q-SPECTRA →"
  },
  {
    "title": "Rigor",
    "group": "research",
    "eyebrow": "WEB APPLICATION / TECHNICAL INTERVIEW PREPARATION",
    "description": "A private workspace for daily practice across 11 learning tracks, with three priorities and saved progress.",
    "href": "/projects/rigor/",
    "linkLabel": "Explore Rigor →"
  },
  {
    "title": "Career Intelligence Aviation",
    "group": "research",
    "eyebrow": "AVIATION / CAREER RESEARCH",
    "description": "Compare technical job listings, skills and engineering career resources across four airlines.",
    "href": "/projects/career-intelligence-aviation/",
    "linkLabel": "Explore Career Intelligence →"
  },
  {
    "title": "PhaseUp — 17E AIT Study Station",
    "group": "research",
    "eyebrow": "INTERACTIVE STUDY TOOL",
    "description": "I built a study web app to prepare for phase-ups during 17E Advanced Individual Training (AIT).",
    "href": "/study/17e/",
    "linkLabel": "Open PhaseUp →"
  },
  {
    "title": "Video Game Tracker",
    "group": "research",
    "eyebrow": "WEB APPLICATION",
    "description": "I built a web app for my game.",
    "href": "/projects/video-game-tracker/",
    "linkLabel": "Explore Video Game Tracker →"
  }
];

export const projectGroups = [
  { id: 'business', title: 'Businesses + Startups' },
  { id: 'research', title: 'Research + Fun Projects' }
] as const;

export function projectsInGroup(group: typeof projectGroups[number]['id']) {
  return selectedProjects.filter(project => project.group === group).reverse();
}
