import { defineConfig } from 'vitepress';

const base = process.env.FOODY_DOCS_BASE || '/';
if (!base.startsWith('/') || !base.endsWith('/')) {
  throw new Error('FOODY_DOCS_BASE must start and end with a slash, for example /foody-clear/.');
}

export default defineConfig({
  title: 'Foody Clear',
  description: 'User guides, installation, feature reference and developer documentation for Foody Clear.',
  lang: 'en-US',
  base,
  ignoreDeadLinks: 'localhostLinks',
  lastUpdated: true,
  vite: {
    resolve: {
      // VitePress 1 uses this absolute ID for search HMR; Vite 6 resolves it explicitly.
      alias: [{ find: /^\/@localSearchIndex$/, replacement: '@localSearchIndex' }],
    },
  },
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }]],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Foody Clear Docs',
    nav: [
      { text: 'Get started', link: '/getting-started/overview' },
      { text: 'User guide', link: '/user-guide/navigation' },
      { text: 'Features', link: '/reference/features' },
      { text: 'Deploy', link: '/deployment/docker' },
      { text: 'Develop', link: '/development/architecture' },
    ],
    sidebar: [
      { text: 'Get started', items: [
        { text: 'Overview', link: '/getting-started/overview' },
        { text: 'Install locally', link: '/getting-started/installation' },
        { text: 'Your first day', link: '/getting-started/first-steps' },
      ] },
      { text: 'User guide', collapsed: false, items: [
        { text: 'Navigation and dashboard', link: '/user-guide/navigation' },
        { text: 'Catalog and organization', link: '/user-guide/catalog' },
        { text: 'Barcode lookup', link: '/user-guide/barcode' },
        { text: 'Shopping lists', link: '/user-guide/shopping-lists' },
        { text: 'Inventories', link: '/user-guide/inventories' },
        { text: 'Meal prep', link: '/user-guide/meal-prep' },
        { text: 'Templates', link: '/user-guide/templates' },
        { text: 'Cycles, day sets and slots', link: '/user-guide/cycles' },
        { text: 'Assignments and calendar', link: '/user-guide/assignments' },
        { text: 'Record your day', link: '/user-guide/day-input' },
        { text: 'External meals', link: '/user-guide/external-meals' },
        { text: 'Statistics and prices', link: '/user-guide/statistics' },
        { text: 'Mobile app and offline access', link: '/user-guide/mobile' },
        { text: 'Auxiliary tools', link: '/user-guide/tools' },
      ] },
      { text: 'Reference', collapsed: true, items: [
        { text: 'All features and routes', link: '/reference/features' },
        { text: 'Units and nutrition', link: '/reference/units-nutrition' },
        { text: 'Product JSON format', link: '/reference/product-json' },
        { text: 'HTTP API', link: '/reference/api' },
        { text: 'Configuration', link: '/reference/configuration' },
        { text: 'Glossary', link: '/reference/glossary' },
      ] },
      { text: 'Deployment and maintenance', collapsed: true, items: [
        { text: 'Docker deployment', link: '/deployment/docker' },
        { text: 'HTTPS and phone cameras', link: '/deployment/https' },
        { text: 'Backups and updates', link: '/deployment/backup' },
        { text: 'Troubleshooting', link: '/troubleshooting' },
      ] },
      { text: 'Development', collapsed: true, items: [
        { text: 'Architecture', link: '/development/architecture' },
        { text: 'Testing', link: '/development/testing' },
        { text: 'Maintain these docs', link: '/development/documentation' },
        { text: 'Project status and license', link: '/project' },
      ] },
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: 'On this page' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ATOKODO/foody-clear-front' },
    ],
    editLink: {
      pattern: 'https://github.com/ATOKODO/foody-clear-front/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    docFooter: { prev: 'Previous page', next: 'Next page' },
    footer: {
      message: 'Foody Clear 1.0.0-alpha.1 · English documentation',
      copyright: 'AGPL-3.0-only · ATOKODO',
    },
  },
});
