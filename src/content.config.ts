import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    brandLogo: z.string().regex(/^\/media\/[a-zA-Z0-9/_.-]+\.svg$/).optional(),
    summary: z.string().min(1),
    category: z.enum(['AI / Machine Learning', 'Data Engineering', 'Robotics & Simulation', 'Quantitative Research', 'GPU / High-Performance Computing', 'Signal Processing / Electronic Warfare']),
    technologies: z.array(z.string()).min(1),
    draft: z.boolean().default(true),
    featured: z.boolean().default(false),
    order: z.number().int().default(100),
    status: z.enum(['Planning', 'In progress', 'Completed']).default('Planning'),
    sourceUrl: z.url().optional(),
    demoUrl: z.url().optional(),
    screenshots: z.array(z.object({ src: z.string(), alt: z.string().min(1), caption: z.string().min(1), example: z.boolean().default(false) })).default([]),
    videos: z.array(z.object({ url: z.url(), title: z.string().min(1) })).default([]),
  }).superRefine((project, context) => {
    if (project.featured && (project.draft || project.status !== 'Completed')) {
      context.addIssue({ code: 'custom', message: 'Featured projects must be published and completed.' });
    }
    for (const url of [project.sourceUrl, project.demoUrl, ...project.videos.map(v => v.url)]) {
      if (url && !url.startsWith('https://')) context.addIssue({ code: 'custom', message: 'External URLs must use HTTPS.' });
    }
    for (const image of project.screenshots) {
      if (!/^\/media\/[a-zA-Z0-9/_.-]+\.(webp|avif|png|jpe?g|svg)$/.test(image.src) || image.src.includes('..')) {
        context.addIssue({ code: 'custom', message: 'Screenshots must reference a local /media/ image.' });
      }
    }
  }),
});

export const collections = { projects };
