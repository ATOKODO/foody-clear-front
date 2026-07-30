import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(projectRoot, 'src');
const tokenFile = resolve(sourceRoot, 'styles', '_tokens.scss');

const styleExtensions = new Set(['.css', '.scss']);
const templateExtensions = new Set(['.html', '.ts']);
const rawColorPattern = /#[\da-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/gi;
const forbiddenStylePattern =
  /::ng-deep|!important|:host-context\s*\(|\.(?:mat-mdc|mdc-)[\w-]*/g;
const localMediaPattern = /@media\s*\(/g;
const legacyUtilityPattern =
  /(?:^|[^\w-])!?(?:[\w-]+:)*(?:bg|text|border|ring|outline|divide|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?\b|(?:^|[^\w-])!?shadow-(?:sm|md|lg|xl|2xl)\b/g;
const tokenDefinitionPattern = /(--app-[\w-]+)\s*:/g;
const tokenUsagePattern = /var\(\s*(--app-[\w-]*[\w])(?=\s*[,)]\s*)/g;

const failures = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function lineNumber(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

function reportMatches(path, content, pattern, message) {
  pattern.lastIndex = 0;
  for (const match of content.matchAll(pattern)) {
    failures.push(
      `${relative(projectRoot, path)}:${lineNumber(content, match.index)} ${message}: ${match[0].trim()}`,
    );
  }
}

function normalizedStylesheet(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, '')
    .trim();
}

const sourceFiles = walk(sourceRoot);
const styleFiles = sourceFiles.filter((path) => styleExtensions.has(extname(path)));
const templateFiles = sourceFiles.filter((path) => templateExtensions.has(extname(path)));
const tokenDefinitions = new Set();
const tokenUsages = new Map();
const stylesheetHashes = new Map();

for (const path of styleFiles) {
  const content = readFileSync(path, 'utf8');

  if (path !== tokenFile) {
    reportMatches(path, content, rawColorPattern, 'raw color outside _tokens.scss');
  }

  reportMatches(path, content, forbiddenStylePattern, 'forbidden styling escape hatch');

  if (!path.endsWith('_base.scss') && !path.endsWith('_mixins.scss')) {
    reportMatches(path, content, localMediaPattern, 'local media query; use a design-system mixin');
  }

  for (const match of content.matchAll(tokenDefinitionPattern)) {
    tokenDefinitions.add(match[1]);
  }

  for (const match of content.matchAll(tokenUsagePattern)) {
    const locations = tokenUsages.get(match[1]) ?? [];
    locations.push(`${relative(projectRoot, path)}:${lineNumber(content, match.index)}`);
    tokenUsages.set(match[1], locations);
  }

  const normalized = normalizedStylesheet(content);
  if (normalized.length > 0) {
    const hash = createHash('sha256').update(normalized).digest('hex');
    const matches = stylesheetHashes.get(hash) ?? [];
    matches.push(relative(projectRoot, path));
    stylesheetHashes.set(hash, matches);
  }
}

for (const path of [...styleFiles, ...templateFiles]) {
  const content = readFileSync(path, 'utf8');
  reportMatches(path, content, legacyUtilityPattern, 'legacy palette/shadow utility');
}

for (const [token, locations] of tokenUsages) {
  if (!tokenDefinitions.has(token)) {
    failures.push(`undefined token ${token}, first used at ${locations[0]}`);
  }
}

for (const duplicates of stylesheetHashes.values()) {
  if (duplicates.length > 1) {
    failures.push(`duplicate stylesheets: ${duplicates.join(', ')}`);
  }
}

if (failures.length > 0) {
  console.error(`Style-system check failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Style-system check passed (${styleFiles.length} stylesheets, ${tokenDefinitions.size} app tokens).`,
  );
}
