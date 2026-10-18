export function challengeStats(solutions) {
  const countBy = key => solutions.reduce((counts, entry) => { counts[entry[key]] = (counts[entry[key]] || 0) + 1; return counts; }, {});
  return { total: solutions.length, categories: countBy('category'), difficulty: countBy('difficulty'), languages: [...new Set(solutions.map(s => s.language))].sort(), platforms: [...new Set(solutions.map(s => s.platform))].sort() };
}
export function matchesChallenge(entry, filters = {}) {
  const haystack = `${entry.title} ${entry.topic} ${entry.tags.join(' ')}`.toLowerCase();
  return (!filters.search || haystack.includes(filters.search.toLowerCase().trim())) && ['platform','category','difficulty','language','topic'].every(key => !filters[key] || entry[key] === filters[key]) && (!filters.tag || entry.tags.includes(filters.tag));
}
export function repositoryFileUrl(repositoryUrl, path) {
  return `${repositoryUrl}/blob/main/${path.split('/').map(encodeURIComponent).join('/')}`;
}
