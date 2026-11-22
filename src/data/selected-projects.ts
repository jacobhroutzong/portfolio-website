// Oldest first: append newly added projects at the end. Both project lists display newest first within each group.
export const selectedProjects = [
  {
    "title": "Decision",
    "group": "business",
    "eyebrow": "AI / MACHINE LEARNING / CASE STUDY",
    "description": "An engineering workbench for inspecting how a system turns telemetry into a decision.",
    "href": "/projects/decision-intelligence-engine/",
    "linkLabel": "Explore Decision →"
  },
  {
    "title": "Ascent",
    "group": "business",
    "eyebrow": "PYTHON / MACHINE LEARNING / FROM SCRATCH",
    "description": "A local-first workspace for studying machine learning and practicing technical reasoning.",
    "href": "/projects/ascent/",
    "linkLabel": "Explore Ascent →"
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
    "title": "Lintel",
    "group": "business",
    "eyebrow": "BUSINESS & OPERATIONS SYSTEMS / CASE STUDY",
    "description": "A smart-home planning project that connects homeowner goals to a practical installation plan.",
    "href": "/projects/lintel/",
    "linkLabel": "Explore Lintel →"
  },
  {
    "title": "Pursuit",
    "group": "business",
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
    "title": "Rigor",
    "group": "business",
    "eyebrow": "WEB APPLICATION / TECHNICAL INTERVIEW PREPARATION",
    "description": "A private workspace for daily practice across 11 learning tracks, with three priorities and saved progress.",
    "href": "/projects/rigor/",
    "linkLabel": "Explore Rigor →"
  },
  {
    "title": "Apex",
    "group": "business",
    "eyebrow": "CAREER INTELLIGENCE / TECHNICAL SKILLS",
    "description": "Explore aviation, government, high-paying and remote technical careers, with verified job evidence, skill breakdowns and guided learning pathways.",
    "href": "/projects/career-intelligence-aviation/",
    "linkLabel": "Explore Apex →"
  },
  {
    "title": "PhaseUp",
    "group": "research",
    "eyebrow": "INTERACTIVE STUDY TOOL",
    "description": "I built a study web app to prepare for phase-ups during 17E Advanced Individual Training (AIT).",
    "href": "/study/17e/",
    "linkLabel": "Open PhaseUp →"
  },
  {
    "title": "GameTracker",
    "group": "research",
    "eyebrow": "WEB APPLICATION",
    "description": "I built a web app for my game.",
    "href": "/projects/video-game-tracker/",
    "linkLabel": "Explore GameTracker →"
  },
  {
    "title": "Axiom",
    "group": "research",
    "eyebrow": "MACHINE LEARNING / MATHEMATICAL COMPUTING",
    "description": "Fit and verify a ridge regression model with numerical and symbolic WebAssembly engines, or use either workbench on its own.",
    "href": "/labs/scientific-systems/axiom-studio/",
    "linkLabel": "Explore Axiom →"
  },
  {
    "title": "Empirava",
    "group": "research",
    "eyebrow": "AI RESEARCH & ENGINEERING LABORATORY",
    "description": "Understand. Experiment. Prove. Develop models, test how they behave, and examine the evidence behind applications and agent workflows.",
    "href": "/projects/empirava/",
    "linkLabel": "Explore Empirava →"
  },
  {
    "title": "Muster",
    "group": "business",
    "eyebrow": "WEB APPLICATION / DATA ENGINEERING",
    "description": "A public research workspace for comparing Army and Air National Guard AGR announcements and checking their official sources.",
    "href": "/projects/muster/",
    "linkLabel": "Explore Muster →"
  }
];

export const projectGroups = [
  { id: 'business', title: 'Businesses + Startups' },
  { id: 'research', title: 'Research + Fun Projects' }
] as const;

export function projectsInGroup(group: typeof projectGroups[number]['id']) {
  return selectedProjects.filter(project => project.group === group).reverse();
}
