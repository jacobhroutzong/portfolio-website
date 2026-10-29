/** @typedef {{name:string,url:string,description:string,platform:string,kind:string,language:string,updated:string|null,archived:boolean}} Repository */
/** @typedef {Repository & {links:{platform:string,kind:string,url:string}[],githubUpdated:string|null}} CombinedRepository */
/** @param {Repository[]} items @returns {CombinedRepository[]} */
export function combineRepositories(items) {
  const key = name => name.toLowerCase();
  const github = items.filter(item => item.platform === 'GitHub');
  /** @type {CombinedRepository[]} */
  const groups = github.map(item => ({ ...item, links:[{platform:'GitHub',kind:item.kind,url:item.url}], githubUpdated:item.updated }));
  const byName = new Map(groups.map(item => [key(item.name),item]));
  for (const item of items.filter(item => item.platform === 'Hugging Face')) {
    const match = byName.get(key(item.name));
    if (match) {
      match.links.push({platform:item.platform,kind:item.kind,url:item.url});
      if (!match.description) match.description = item.description;
    } else groups.push({...item,links:[{platform:item.platform,kind:item.kind,url:item.url}],githubUpdated:null});
  }
  return groups.sort((a,b) => Date.parse(b.githubUpdated || b.updated || '1970-01-01') - Date.parse(a.githubUpdated || a.updated || '1970-01-01') || a.name.localeCompare(b.name));
}
