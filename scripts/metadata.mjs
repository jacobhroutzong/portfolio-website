export const categories = ['Algorithms & Data Structures', 'SQL & Data Analytics', 'Machine Learning', 'GPU Programming', 'Data Engineering', 'Quantitative & Numerical Computing'];
export const platforms = ['LeetCode', 'NeetCode', 'StrataScratch', 'Interview Query', 'Deep-ML', 'Tensara', 'LeetGPU', 'Custom exercises'];
export const difficulties = ['Easy', 'Medium', 'Hard', 'Unrated'];

export const entrySchema = {
  type: 'object', additionalProperties: false,
  required: ['id', 'title', 'platform', 'sourceUrl', 'category', 'difficulty', 'language', 'topic', 'tags', 'solutionPath', 'dateSolved', 'complexity', 'example'],
  properties: {
    id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' }, title: { type: 'string', minLength: 1 },
    platform: { enum: platforms }, sourceUrl: { type: 'string' }, category: { enum: categories }, difficulty: { enum: difficulties },
    language: { type: 'string', minLength: 1 }, topic: { type: 'string', minLength: 1 },
    tags: { type: 'array', uniqueItems: true, items: { type: 'string', minLength: 1 } },
    solutionPath: { type: 'string', minLength: 1 }, explanationPath: { type: 'string', minLength: 1 },
    dateSolved: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, example: { type: 'boolean' },
    complexity: { type: 'object', required: ['time','space'], additionalProperties: false, properties: { time: { type: 'string', minLength:1 }, space: { type:'string', minLength:1 } } },
    benchmark: { type: 'object', required: ['description','runtimeMs','environment'], additionalProperties: false, properties: { description: { type:'string', minLength:1 }, runtimeMs:{type:'number',minimum:0}, environment:{type:'string', minLength:1} } },
  },
};

export function safePath(value) { return typeof value === 'string' && /^[a-zA-Z0-9_./-]+$/.test(value) && !value.startsWith('/') && !value.split('/').some(s => s === '..' || s === '.' || !s); }
export function httpsUrl(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } }
export function validateEntry(value, label = 'metadata') {
  const fail = message => { throw new Error(`${label}: ${message}`); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected an object');
  for (const key of Object.keys(value)) if (!Object.hasOwn(entrySchema.properties, key)) fail(`unknown field ${key}`);
  for (const key of entrySchema.required) if (!Object.hasOwn(value,key)) fail(`missing ${key}`);
  for (const key of ['title','language','topic']) if (typeof value[key] !== 'string' || !value[key].trim()) fail(`invalid ${key}`);
  if (typeof value.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) fail('invalid id');
  if (!categories.includes(value.category)) fail('invalid category');
  if (!platforms.includes(value.platform)) fail('invalid platform');
  if (!difficulties.includes(value.difficulty)) fail('invalid difficulty');
  if (typeof value.example !== 'boolean') fail('example must be boolean');
  if (!Array.isArray(value.tags) || value.tags.some(t => typeof t !== 'string' || !t.trim()) || new Set(value.tags).size !== value.tags.length) fail('tags must be unique nonempty strings');
  for (const key of ['solutionPath','explanationPath']) if ((key === 'solutionPath' || value[key] !== undefined) && !safePath(value[key])) fail(`unsafe ${key}`);
  if (typeof value.sourceUrl !== 'string' || (value.sourceUrl !== '' && !httpsUrl(value.sourceUrl)) || (value.sourceUrl === '' && value.platform !== 'Custom exercises')) fail('sourceUrl must be HTTPS (empty allowed for custom exercises)');
  const date = new Date(`${value.dateSolved}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.dateSolved) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0,10) !== value.dateSolved || value.dateSolved > new Date().toISOString().slice(0,10)) fail('invalid or future dateSolved');
  const complexity = value.complexity;
  if (!complexity || typeof complexity !== 'object' || Array.isArray(complexity) || Object.keys(complexity).some(k => !['time','space'].includes(k)) || ['time','space'].some(k => typeof complexity[k] !== 'string' || !complexity[k].trim())) fail('complexity requires time and space');
  if (value.benchmark !== undefined) {
    const b = value.benchmark;
    if (!b || typeof b !== 'object' || Array.isArray(b) || Object.keys(b).some(k => !['description','runtimeMs','environment'].includes(k)) || typeof b.runtimeMs !== 'number' || !Number.isFinite(b.runtimeMs) || b.runtimeMs < 0 || ['description','environment'].some(k => typeof b[k] !== 'string' || !b[k].trim())) fail('invalid benchmark');
  }
  return value;
}
export function validateIndex(index) {
  if (!index || typeof index !== 'object' || Array.isArray(index) || Object.keys(index).some(k => !['version','repositoryUrl','solutions'].includes(k)) || index.version !== 1 || !Array.isArray(index.solutions)) throw new Error('Unsupported challenge index');
  if (typeof index.repositoryUrl !== 'string' || (index.repositoryUrl && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(index.repositoryUrl))) throw new Error('repositoryUrl must be a GitHub repository URL or empty');
  const ids = new Set();
  for (const entry of index.solutions) { validateEntry(entry, entry.id || 'entry'); if (entry.example) throw new Error('Example entries must not appear in the published index'); if (ids.has(entry.id)) throw new Error(`Duplicate id: ${entry.id}`); ids.add(entry.id); }
  if (index.solutions.length && !index.repositoryUrl) throw new Error('Configure repositoryUrl before publishing solutions');
  return index;
}
export function canonicalIndex(repositoryUrl, solutions) {
  const ordered = [...solutions].filter(e => !e.example).sort((a,b) => a.dateSolved === b.dateSolved ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : (a.dateSolved > b.dateSolved ? -1 : 1));
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
  return JSON.stringify(canonical(validateIndex({ version: 1, repositoryUrl, solutions: ordered })), null, 2) + '\n';
}
