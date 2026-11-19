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
    "title": "Tunera",
    "group": "research",
    "eyebrow": "PYTHON / MODEL FINE-TUNING",
    "description": "A model development workflow for planning experiments and comparing results.",
    "href": "/projects/tunera/",
    "linkLabel": "Explore Tunera →"
  },
  {
    "title": "Recursa Studio",
    "group": "research",
    "eyebrow": "RECURSIVE AI SYSTEMS RESEARCH",
    "description": "Explore Application Synthesis through recorded specifications, traces, and benchmarks, and Agent Optimization through an interactive lab for harness changes and reusable lessons.",
    "href": "/projects/recursa/",
    "linkLabel": "Explore Recursa Studio →"
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
    "title": "Apex — Career Intelligence",
    "group": "research",
    "eyebrow": "CAREER INTELLIGENCE / TECHNICAL SKILLS",
    "description": "Explore aviation, government, high-paying and remote technical careers, with verified job evidence, skill breakdowns and guided learning pathways.",
    "href": "/projects/career-intelligence-aviation/",
    "linkLabel": "Explore Apex →"
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
  },
  {
    "title": "Mercato",
    "group": "business",
    "eyebrow": "BUSINESS & OPERATIONS SYSTEMS / PRIVATE APP",
    "description": "A private operations workspace combining ecommerce product research, sourcing, purchasing, inventory and finance with CreatorOS content planning and analytics. Hosted access and Google Sheets sync are undergoing release verification.",
    "href": "/projects/mercato/",
    "linkLabel": "Explore Mercato →"
  },
  {
    "title": "Causarium",
    "group": "research",
    "eyebrow": "MODEL INTERPRETABILITY / RESEARCH",
    "description": "Inspect recorded activation swaps in Pythia-70M and Qwen3.5-2B with layer maps, donor controls, and measured logit margins.",
    "href": "/projects/causarium/",
    "linkLabel": "Explore the research exhibit →"
  },
  {
    "title": "Axiom Studio",
    "group": "research",
    "eyebrow": "MACHINE LEARNING / MATHEMATICAL COMPUTING",
    "description": "Fit and verify a ridge regression model with numerical and symbolic WebAssembly engines, or use either workbench on its own.",
    "href": "/labs/scientific-systems/axiom-studio/",
    "linkLabel": "Start with the Optimization Lab"
  }
];

export const projectGroups = [
  { id: 'business', title: 'Businesses + Startups' },
  { id: 'research', title: 'Research + Fun Projects' }
] as const;

export function projectsInGroup(group: typeof projectGroups[number]['id']) {
  return selectedProjects.filter(project => project.group === group).reverse();
}
