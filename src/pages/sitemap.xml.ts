import type { APIRoute } from 'astro';
import { visibleProjects } from '../lib/projects';
import { profile } from '../config/profile';
import { labProjects, detailPath } from '../data/scientific-systems';
export const GET: APIRoute = async ({ site }) => {
  const paths = profile.configured && site?.hostname !== 'portfolio.example.com' ? ['/', '/labs/scientific-systems/', ...labProjects.filter(p => p.detail).map(detailPath), '/activity/', '/projects/decision-intelligence-engine/', '/about/', '/projects/', '/challenges/', '/gallery/', '/connect/', '/apps/equityscout/', '/links/', ...(await visibleProjects()).filter(p => !p.data.draft).map(p => `/projects/${p.id}/`)] : [];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${new URL(path,site).href.replaceAll('&','&amp;')}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});
};
