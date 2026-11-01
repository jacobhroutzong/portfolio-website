// Portfolio information architecture.
//   Collection (6 categories) → Suite (an application experience) → Member (an existing, working app).
// URLs are the existing, working routes; only grouping and presentation live here.
// Planned engines (circuit simulation, compiler tools, vision math, typesetting) are intentionally
// absent: nothing unbuilt is presented as available.
// `runs` states honestly where a member executes today; it changes as members move to native workspaces.

export type RunsOn = 'browser' | 'hosted';

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Member {
  id: string;
  title: string;
  /** One task-focused sentence: what a visitor can do with it. */
  summary: string;
  href: string;
  runs: RunsOn;
  tags: string[];
  /** Secondary links shown on the full card. */
  links: ProjectLink[];
  /** A member that is its own business or ecosystem: link out instead of restyling it. */
  standalone?: ProjectLink;
}

export interface Suite {
  id: string;
  title: string;
  /** What the suite lets a visitor do, in one sentence. */
  summary: string;
  members: Member[];
}

export interface Collection {
  id: string;
  number: string;
  title: string;
  blurb: string;
  glyph: 'curve' | 'tree' | 'gate' | 'matrix' | 'steps' | 'ladder';
  /** Optional overview page for the whole collection. */
  overview?: ProjectLink;
  suites: Suite[];
}

export const runsLabel: Record<RunsOn, string> = {
  browser: 'Runs in your browser',
  hosted: 'Opens a hosted demo',
};

export const collections: Collection[] = [
  {
    id: 'ai-research',
    number: '01',
    title: 'AI Research & Model Engineering',
    blurb: 'Evaluating and adapting small language models.',
    glyph: 'curve',
    suites: [
      {
        id: 'model-engineering',
        title: 'Model Engineering Studio',
        summary: 'Evaluate a small model, then adapt it: failure inspection and memory planning in Crucible, QLoRA fine-tuning runs in Tunera.',
        members: [
          {
            id: 'modelforge',
            title: 'Crucible',
            summary: 'Score a small model’s tool use, inspect exactly where it fails, and plan its memory budget before any training.',
            href: '/projects/modelforge/',
            runs: 'hosted',
            tags: ['Python', 'Model evaluation'],
            links: [{ label: 'Source', href: 'https://huggingface.co/spaces/jacobroutzong/modelforge/tree/main' }],
          },
          {
            id: 'tunera',
            title: 'Tunera',
            summary: 'Set up a Qwen3 QLoRA fine-tuning run, validate the dataset, and resume interrupted training from checkpoints.',
            href: '/projects/tunera/',
            runs: 'hosted',
            tags: ['Qwen3', 'QLoRA', 'Checkpoints'],
            links: [{ label: 'Source', href: 'https://huggingface.co/spaces/jacobroutzong/tuneledger/tree/main' }],
          },
        ],
      },
    ],
  },
  {
    id: 'agent-systems',
    number: '02',
    title: 'Agent Systems & Orchestration',
    blurb: 'Agents that plan, execute, and improve their own scaffolding.',
    glyph: 'tree',
    suites: [
      {
        id: 'agent-systems-studio',
        title: 'Agent Systems Studio',
        summary: 'Recursive agents, two ways: plan-and-replay application synthesis in Recursa, harness self-improvement in Harness² Lab.',
        members: [
          {
            id: 'recursa',
            title: 'Recursa',
            summary: 'Follow how a large application spec becomes dependency-aware plans, saved artifacts, and replayable execution traces. Model-backed generation is not yet verified.',
            href: '/projects/recursa/',
            runs: 'hosted',
            tags: ['Python', 'Recursive inference', 'Experiment tracking'],
            links: [{ label: 'Source', href: 'https://github.com/jacobhroutzong/recursa' }],
          },
          {
            id: 'harness2-lab',
            title: 'Harness² Lab',
            summary: 'Propose edits to an agent’s prompts, rules, and tools, then inspect the traces and compare fixed against adaptive compute budgets.',
            href: '/projects/harness2-lab/',
            runs: 'hosted',
            tags: ['Python', 'FastAPI', 'Agent systems'],
            links: [{ label: 'Source', href: 'https://github.com/jacobhroutzong/harness2-lab' }],
          },
        ],
      },
    ],
  },
  {
    id: 'decision-systems',
    number: '03',
    title: 'Decision & Optimization Systems',
    blurb: 'Turning telemetry into routed decisions with explicit confidence gates.',
    glyph: 'gate',
    suites: [
      {
        id: 'decision-intelligence',
        title: 'Decision Intelligence',
        summary: 'Seven scenarios in one application: aviation dispatch, robot safety, GNSS integrity, order book risk, GPU thermals, macro volatility, and satellite RF.',
        members: [
          {
            id: 'decision-intelligence-engine',
            title: 'Decision Intelligence Engine',
            summary: 'Adjust telemetry and read the chosen action, risk signal, severity, and the JSON audit record behind it.',
            href: '/projects/decision-intelligence-engine/',
            runs: 'hosted',
            tags: ['Python', 'NumPy', 'Seven scenarios'],
            links: [{ label: 'Source', href: 'https://github.com/jacobhroutzong/decision-intelligence-engine' }],
          },
        ],
      },
    ],
  },
  {
    id: 'scientific-systems',
    number: '04',
    title: 'Scientific & Systems Engineering',
    blurb: 'Numerical and symbolic engines written in C++20 and validated independently.',
    glyph: 'matrix',
    overview: { label: 'Lab overview and roadmap', href: '/labs/scientific-systems/' },
    suites: [
      {
        id: 'mathematical-intelligence',
        title: 'Mathematical Intelligence Studio',
        summary: 'Exact symbolic mathematics with checked, traceable transformation steps.',
        members: [
          {
            id: 'symbolic-engine',
            title: 'Symbolic Mathematics Engine',
            summary: 'Differentiate expressions exactly in C++20 while preserving their domains, and inspect each checked transformation.',
            href: '/labs/scientific-systems/symbolic/',
            runs: 'browser',
            tags: ['C++20', 'WebAssembly', 'Exact arithmetic'],
            links: [],
          },
        ],
      },
      {
        id: 'numerical-visualization',
        title: 'Numerical & Visualization Studio',
        summary: 'Checked numerical linear algebra, running as WebAssembly in the browser.',
        members: [
          {
            id: 'numerical-engine',
            title: 'Numerical Computing Engine',
            summary: 'Solve linear systems with LU factorization and compare against an independent Householder QR check.',
            href: '/labs/scientific-systems/numerical/',
            runs: 'browser',
            tags: ['C++20', 'WebAssembly', 'Linear algebra'],
            links: [],
          },
        ],
      },
    ],
  },
  {
    id: 'business-operations',
    number: '05',
    title: 'Business & Operations Systems',
    blurb: 'Tools for underwriting acquisitions and scoping practical AI work.',
    glyph: 'steps',
    suites: [
      {
        id: 'business-operations-systems',
        title: 'Business & Operations Systems',
        summary: 'Two separate workspaces: acquisition underwriting in EquityScout, AI opportunity scoping in Leverline.',
        members: [
          {
            id: 'equityscout',
            title: 'EquityScout',
            summary: 'Underwrite a real-estate acquisition with evidence gates and refinance stress scenarios. The public calculator uses an invented property.',
            href: '/projects/equityscout/',
            runs: 'browser',
            tags: ['Python', 'Decimal arithmetic', 'Data provenance'],
            links: [{ label: 'Try the calculator', href: '/apps/equityscout/' }],
          },
          {
            id: 'leverline',
            title: 'Leverline',
            summary: 'Estimate where AI could save a small business time and money, with an opportunity scan and ROI calculator. Estimates come from a catalog, not a live model.',
            href: '/projects/leverline/',
            runs: 'browser',
            tags: ['Applied AI', 'ROI modeling'],
            links: [],
            standalone: { label: 'Open the Leverline site', href: '/apps/leverline/' },
          },
        ],
      },
    ],
  },
  {
    id: 'education-tools',
    number: '06',
    title: 'Education & Developer Tools',
    blurb: 'Practice environments for learning and building.',
    glyph: 'ladder',
    suites: [
      {
        id: 'ascent-suite',
        title: 'Ascent',
        summary: 'Study AI fundamentals through linked references, run original Python problems in the browser, and review with spaced retrieval.',
        members: [
          {
            id: 'ascent',
            title: 'Ascent',
            summary: 'Progress saves locally; Python runs in your browser.',
            href: '/ascent/',
            runs: 'browser',
            tags: ['TypeScript', 'Pyodide', 'Spaced retrieval'],
            links: [
              { label: 'Walkthrough', href: '/projects/ascent/' },
              { label: 'Source', href: 'https://github.com/jacobhroutzong/portfolio-website' },
            ],
          },
        ],
      },
    ],
  },
];

export const suiteCount = collections.reduce((total, c) => total + c.suites.length, 0);
export const memberCount = collections.reduce((total, c) => total + c.suites.reduce((n, s) => n + s.members.length, 0), 0);
/** Ids of every member app, used to keep draft-only walkthroughs out of the main listing. */
export const registeredMemberIds = new Set(collections.flatMap(c => c.suites.flatMap(s => s.members.map(m => m.id))));
