import { readFile, writeFile } from 'node:fs/promises';
const destination = new URL('../src/data/activity.json',import.meta.url);
async function get(url) {
  const headers = {'User-Agent':'jacob-routzong-portfolio',Accept:'application/json'};
  if (new URL(url).hostname === 'api.github.com' && process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url,{headers,signal:AbortSignal.timeout(20000),redirect:'error'});
  if (!response.ok) throw new Error(`Public repository refresh failed: ${new URL(url).hostname} HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Expected a repository list');
  return data;
}
const repos=[];
for (let page=1;page<=10;page++) {
 const entries=await get(`https://api.github.com/users/jacobhroutzong/repos?sort=pushed&per_page=100&page=${page}`);
 repos.push(...entries);
 if (entries.length < 100) break;
 if (page === 10) throw new Error('Repository pagination limit reached; previous snapshot preserved');
}
const [models,datasets,spaces] = await Promise.all([
 get('https://huggingface.co/api/models?author=jacobroutzong&full=true&limit=1000'),
 get('https://huggingface.co/api/datasets?author=jacobroutzong&full=true&limit=1000'),
 get('https://huggingface.co/api/spaces?author=jacobroutzong&full=true&limit=1000'),
]);
// Ignore this workflow's own snapshot-only commits when dating the portfolio repo.
const portfolio= repos.find(repo => repo.name === 'portfolio-website');
if (portfolio) {
 const commits=await get('https://api.github.com/repos/jacobhroutzong/portfolio-website/commits?per_page=100');
 const latest=commits.find(commit => !commit.commit.message.startsWith('Refresh public repository activity'));
 if (!latest) throw new Error('Could not find a portfolio source commit');
 portfolio.pushed_at=latest.commit.committer.date;
}
const items=[
 ...repos.filter(repo=>!repo.private).map(repo=>({name:repo.name,url:repo.html_url,description:repo.description||'',platform:'GitHub',kind:repo.fork?'Fork':'Repository',language:repo.language||'',updated:repo.pushed_at,archived:repo.archived})),
 ...[['Model',models],['Dataset',datasets],['Space',spaces]].flatMap(([kind,list])=>list.filter(repo=>!repo.private && repo.id?.startsWith('jacobroutzong/')).map(repo=>({name:repo.id.split('/').slice(1).join('/'),url:`https://huggingface.co/${kind==='Dataset'?'datasets/':kind==='Space'?'spaces/':''}${repo.id}`,description:repo.pipeline_tag||'',platform:'Hugging Face',kind,language:'',updated:repo.lastModified||repo.createdAt||null,archived:false}))),
].sort((a,b)=>(b.updated||'').localeCompare(a.updated||'') || a.url.localeCompare(b.url));
for (const item of items) {
 if (!item.name || !item.url.startsWith(item.platform==='GitHub'?'https://github.com/jacobhroutzong/':'https://huggingface.co/') || (item.updated && !Number.isFinite(Date.parse(item.updated)))) throw new Error('Invalid public repository metadata');
}
let previous;
try {previous=JSON.parse(await readFile(destination,'utf8'));} catch(error) {if(error.code!=='ENOENT')throw error;}
if (JSON.stringify(previous?.items) === JSON.stringify(items)) console.log('Public repository metadata unchanged; keeping snapshot and checked date.');
else {
 const fetchedAt=new Date().toISOString();
 await writeFile(destination,JSON.stringify({fetchedAt,githubFetchedAt:fetchedAt,items},null,2)+'\n');
 console.log(`Saved ${items.length} public repository entries; no private repositories included.`);
}
