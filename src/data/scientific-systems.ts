export type LabStatus = 'In progress' | 'Planning';
export interface LabProject {
  id: string;
  number: string;
  title: string;
  discipline: string;
  status: LabStatus;
  summary: string;
  implemented: readonly string[];
  next: string;
  limitation: string;
  detail: boolean;
  sourceUrl?: string;
}

// Dated validation snapshots; public source repositories were verified at release.
export const labProjects: readonly LabProject[] = [
  { id: 'numerical', number: '01', title: 'Numerical Computing Engine', discipline: 'LINEAR ALGEBRA', status: 'In progress', summary: 'From recovered LU control flow to independently tested linear systems.', implemented: ['Recursive LU with partial pivoting', 'Multiple right-hand-side solves', 'Independent Householder QR (native)', 'NumPy validation and browser solves'], sourceUrl: 'https://github.com/jacobhroutzong/scientific-numerical-engine', next: 'Least-squares contracts and broader QR reference validation.', limitation: 'Original-DLL execution and bitwise equivalence remain unverified.', detail: true },
  { id: 'symbolic', number: '02', title: 'Symbolic Mathematics Engine', discipline: 'EXACT COMPUTATION', status: 'In progress', summary: 'Expressions that retain exact values, structure and domain restrictions.', implemented: ['Arbitrary-precision integers and rationals', 'Parser, differentiation and simplification', 'Bounded checked simplification traces (native)', 'Exact polynomial identity checks and LaTeX'], sourceUrl: 'https://github.com/jacobhroutzong/symbolic-math-engine', next: 'Broader generated domain tests and detailed rule traces.', limitation: 'A bounded symbolic core, not a general computer algebra system.', detail: true },
  { id: 'compiler', number: '03', title: 'Compiler & Optimization Engine', discipline: 'LANGUAGE SYSTEMS', status: 'Planning', summary: 'A small typed language with inspectable intermediate representations.', implemented: [], next: 'Specify the language and a reference interpreter before optimization.', limitation: 'Lexer, typed IR and optimization passes are planned.', detail: false },
  { id: 'vision-math', number: '04', title: 'Computer Vision Math Solver', discipline: 'PERCEPTION + REASONING', status: 'Planning', summary: 'Connect mathematical recognition to checked symbolic transformations.', implemented: [], next: 'Choose a licensed dataset and a deliberately small expression grammar.', limitation: 'No OCR model or recognition accuracy has been demonstrated.', detail: false },
  { id: 'circuits', number: '05', title: 'Scientific Circuit Simulator', discipline: 'PHYSICAL SYSTEMS', status: 'Planning', summary: 'Modified nodal analysis built on an explicit numerical solve contract.', implemented: [], next: 'Linear DC resistor and source networks, then RC transients.', limitation: 'No circuit solver, device models or FPGA acceleration implemented.', detail: false },
  { id: 'typesetting', number: '06', title: 'Mathematical Typesetting Engine', discipline: 'MATHEMATICAL LAYOUT', status: 'Planning', summary: 'Turn a presentation tree into deterministic, readable mathematical SVG.', implemented: [], next: 'Font metrics and fraction, radical and script layout.', limitation: 'Current formula presentation uses KaTeX; a new layout engine is planned.', detail: false },
  { id: 'visualization', number: '07', title: 'Scientific Visualization Engine', discipline: 'GEOMETRY + DATA', status: 'Planning', summary: 'Scientific coordinates, meaningful scales and portable vector plots.', implemented: [], next: 'Linear transforms, ticks, series and deterministic SVG export.', limitation: 'The recorded examples here are not a completed plotting engine.', detail: false },
];

export const numericalResults = {
  date: '2026-10-26', testEntries: 21, solveCases: 98,
  maxSolutionDifference: 2.7755575615628914e-17,
  maxBackwardError: 3.5603296732149557e-16,
  environment: 'MSVC 19.44 · Windows x64 · NumPy 2.3.5',
} as const;
export const symbolicResults = { date: '2026-10-26', testEntries: 10, integerCases: 200, rationalCases: 100, symbolicCases: 66, reference: 'SymPy 1.14.0 · Python int / Fraction' } as const;
export const detailPath = (project: LabProject) => `/labs/scientific-systems/${project.id}/`;
