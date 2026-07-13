// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import { readFileSync } from 'node:fs';

// Node never loads .env into process.env by itself. On Vercel the variables are injected
// into the real environment, but locally they only live in the .env file — so read both,
// or a local build silently ships an empty access key (no contact form, no lead emails).
const fileEnv = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const env = (name) => process.env[name] ?? fileEnv[name] ?? '';

const siteDetails = JSON.parse(
  readFileSync(new URL('./src/data/site-details.json', import.meta.url), 'utf-8'),
);

// Canonical URLs + sitemap. Priority:
//   1. the real domain, once it's set in site-details.json
//   2. the Vercel deployment URL (so previews get correct canonicals before a domain is bought)
//   3. a placeholder so local builds always work
const vercelUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? null;

const site =
  siteDetails.domain && !siteDetails.domain.includes('PLACEHOLDER')
    ? siteDetails.domain
    : vercelUrl
      ? `https://${vercelUrl}`
      : 'https://www.abirlev.com';

export default defineConfig({
  site,
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    define: {
      // the spec's env var names, exposed to the calculator island at build time
      'import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY': JSON.stringify(
        env('WEB3FORMS_ACCESS_KEY') || env('PUBLIC_WEB3FORMS_ACCESS_KEY'),
      ),
      'import.meta.env.PUBLIC_SHEETS_WEBHOOK_URL': JSON.stringify(
        env('SHEETS_WEBHOOK_URL') || env('PUBLIC_SHEETS_WEBHOOK_URL'),
      ),
      'import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME': JSON.stringify(
        env('CLOUDINARY_CLOUD_NAME') || env('PUBLIC_CLOUDINARY_CLOUD_NAME'),
      ),
      'import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(
        env('CLOUDINARY_UPLOAD_PRESET') || env('PUBLIC_CLOUDINARY_UPLOAD_PRESET'),
      ),
    },
  },
});
