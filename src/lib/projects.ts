import { getCollection } from 'astro:content';

export const previewDrafts = import.meta.env.DEV && import.meta.env.INCLUDE_DRAFTS === 'true';
export async function visibleProjects() {
  const projects = await getCollection('projects', ({ data }) => !data.draft || previewDrafts);
  return projects.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}
