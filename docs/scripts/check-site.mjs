import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = resolve(docsRoot, process.argv[2] || '.vitepress/dist');
const base = process.env.FOODY_DOCS_BASE || '/';
const origin = 'https://docs.example';
const errors = [];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return nested.flat();
}

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

const htmlFiles = (await filesIn(outputRoot)).filter((path) => extname(path) === '.html');
const pages = new Map(await Promise.all(htmlFiles.map(async (path) => [path, await readFile(path, 'utf8')])));
let checkedLinks = 0;

for (const [path, html] of pages) {
  const pageUrl = new URL(base + relative(outputRoot, path).split(sep).join('/'), origin);
  for (const match of html.matchAll(/<(?:a|link|img|script)\b[^>]*?\b(?:href|src)=(['"])(.*?)\1/g)) {
    const href = decodeEntities(match[2]);
    const url = new URL(href, pageUrl);
    if (url.origin !== origin) continue;
    checkedLinks++;
    if (!url.pathname.startsWith(base)) {
      errors.push(`${relative(outputRoot, path)}: link escapes hosting base: ${href}`);
      continue;
    }
    const localPath = decodeURIComponent(url.pathname.slice(base.length));
    let target = resolve(outputRoot, localPath || 'index.html');
    if (target !== outputRoot && !target.startsWith(outputRoot + sep)) {
      errors.push(`${relative(outputRoot, path)}: link escapes output directory: ${href}`);
      continue;
    }
    try {
      const info = await stat(target).catch(() => null);
      if (info?.isDirectory()) target = join(target, 'index.html');
      else if (!info && !extname(target)) target += '.html';
      await stat(target);
      if (url.hash && extname(target) === '.html') {
        const targetHtml = pages.get(target) ?? await readFile(target, 'utf8');
        const ids = new Set([...targetHtml.matchAll(/\bid=(['"])(.*?)\1/g)].map((id) => decodeEntities(id[2])));
        const anchor = decodeURIComponent(url.hash.slice(1));
        if (!ids.has(anchor)) errors.push(`${relative(outputRoot, path)}: missing anchor: ${href}`);
      }
    } catch {
      errors.push(`${relative(outputRoot, path)}: missing local target: ${href}`);
    }
  }
}

const routeSource = await readFile(resolve(docsRoot, '../src/app/app.routes.ts'), 'utf8');
const featureIndex = await readFile(join(docsRoot, 'reference/features.md'), 'utf8');
const routes = [...routeSource.matchAll(/\bpath\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
const documentedRoutes = new Set([...featureIndex.matchAll(/\|\s*`\/([^`]+)`\s*\|/g)].map((match) => match[1]));
for (const route of routes) {
  if (!documentedRoutes.has(route)) errors.push(`reference/features.md: undocumented application route /${route}`);
}
for (const route of documentedRoutes) {
  if (!routes.includes(route)) errors.push(`reference/features.md: stale application route /${route}`);
}

const config = await readFile(join(docsRoot, '.vitepress/config.mts'), 'utf8');
const navigationLinks = new Set([...config.matchAll(/\blink\s*:\s*['"](\/[^'"]*)['"]/g)]
  .map((match) => match[1].replace(/\/$/, '')));
const contentRoots = ['getting-started', 'user-guide', 'reference', 'deployment', 'development'];
const markdown = (await Promise.all(contentRoots.map((directory) => filesIn(join(docsRoot, directory)))))
  .flat().filter((path) => extname(path) === '.md');
markdown.push(join(docsRoot, 'troubleshooting.md'), join(docsRoot, 'project.md'));
for (const path of markdown) {
  const route = '/' + relative(docsRoot, path).split(sep).join('/').replace(/\.md$/, '');
  if (!navigationLinks.has(route)) errors.push(`${relative(docsRoot, path)}: page absent from navigation`);
  if (!pages.has(resolve(outputRoot, route.slice(1) + '.html'))) errors.push(`${route}: page absent from build`);
}

if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation checked: ${markdown.length + 1} content pages, ${routes.length} application routes, ${checkedLinks} local links, assets and anchors (base ${base}).`);
}
