import { writeFile } from 'node:fs/promises';
const headers = { 'User-Agent': 'jacob-routzong-portfolio', Accept: 'application/json' };
async function get(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error(`Expected a project list from ${url}`);
  return data;
}
const [repos, models, datasets, spaces] = await Promise.all([
  get('https://api.github.com/users/jacobhroutzong/repos?sort=pushed&per_page=100'),
  get('https://huggingface.co/api/models?author=jacobroutzong&full=true'),
  get('https://huggingface.co/api/datasets?author=jacobroutzong&full=true'),
  get('https://huggingface.co/api/spaces?author=jacobroutzong&full=true'),
]);
const items = [
  ...repos.map(r => ({ name:r.name, url:r.html_url, description:r.description || '', platform:'GitHub', kind:r.fork ? 'Fork' : 'Repository', language:r.language || '', updated:r.pushed_at, archived:r.archived })),
  ...[['Model',models],['Dataset',datasets],['Space',spaces]].flatMap(([kind,list]) => list.map(r => ({ name:r.id.split('/').slice(1).join('/'), url:`https://huggingface.co/${kind === 'Dataset' ? 'datasets/' : kind === 'Space' ? 'spaces/' : ''}${r.id}`, description:r.pipeline_tag || '', platform:'Hugging Face', kind, language:'', updated:r.lastModified || r.createdAt || null, archived:false }))),
].sort((a,b) => (b.updated || '').localeCompare(a.updated || ''));
await writeFile(new URL('../src/data/activity.json',import.meta.url),JSON.stringify({ fetchedAt:new Date().toISOString(),githubFetchedAt:new Date().toISOString(),items },null,2)+'\n');
console.log(`Saved ${repos.length} GitHub repositories, ${models.length} models, ${datasets.length} datasets, and ${spaces.length} Spaces.`);
