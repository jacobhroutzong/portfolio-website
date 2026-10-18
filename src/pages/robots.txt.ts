import type { APIRoute } from 'astro';
import { profile } from '../config/profile';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\n${profile.configured && site?.hostname !== 'portfolio.example.com' ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${new URL('/sitemap.xml',site).href}\n`,{headers:{'Content-Type':'text/plain'}});
