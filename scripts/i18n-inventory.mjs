import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseTemplate } from '@angular/compiler';

export function sourceFiles(directory = 'src') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

export function walkTemplate(nodes, visit, ancestors = []) {
  for (const node of nodes) {
    visit(node, ancestors);
    const parents = [...ancestors, node];
    for (const key of ['children', 'branches', 'cases', 'groups']) {
      if (Array.isArray(node[key])) walkTemplate(node[key], visit, parents);
    }
    for (const key of ['empty', 'placeholder', 'loading', 'error']) {
      if (node[key]) walkTemplate([node[key]], visit, parents);
    }
  }
}

export const normalizeMessage = (value) => value.replace(/\s+/g, ' ').trim();
export const humanText = (value) => /[a-zA-ZÀ-ÿ]/.test(value) &&
  !/^(?:FC|Foody Clear|EN|FR|JSON|UTC|g|kg|ml|l|kcal|€|ID|#|YYYY-MM-DD|HH:mm)$/.test(value);
export const textAttributes = new Set([
  'aria-label', 'ariaLabel', 'title', 'placeholder', 'matTooltip', 'label', 'alt',
  'sideTitle', 'sideSubtitle', 'sideAriaLabel', 'detailAriaLabel', 'message', 'detailsLabel',
]);
export function bindingLiterals(ast) {
  if (!ast || typeof ast !== 'object') return [];
  if (ast.constructor.name === 'LiteralPrimitive' && typeof ast.value === 'string') return [ast.value];
  return Object.values(ast).flatMap((value) =>
    Array.isArray(value) ? value.flatMap(bindingLiterals) : bindingLiterals(value),
  );
}

if (process.argv[1]?.endsWith('i18n-inventory.mjs')) {
  const messages = new Map();
  const add = (value, path) => {
    const key = normalizeMessage(value);
    if (humanText(key)) messages.set(key, [...new Set([...(messages.get(key) ?? []), path])]);
  };
  for (const path of sourceFiles().filter((path) => path.endsWith('.html') && path !== 'src/index.html')) {
    const source = readFileSync(path, 'utf8');
    const template = parseTemplate(source, path);
    if (template.errors?.length) throw new Error(`${path}: ${template.errors}`);
    walkTemplate(template.nodes, (node, ancestors) => {
      if (ancestors.some((parent) => ['pre', 'code', 'svg'].includes(parent.name))) return;
      if (node.constructor.name === 'Text') add(node.value, path);
      if (node.constructor.name === 'BoundText' && node.value.ast.strings) {
        if (process.argv.includes('--dynamic') && !node.value.source.includes('| translate')) add(node.value.source, path);
        if (process.argv.includes('--literals') && !node.value.source.includes('| translate')) {
          for (const literal of bindingLiterals(node.value.ast)) add(literal, path);
        }
        const { strings } = node.value.ast;
        if (strings.some((part) => humanText(part.trim()))) {
          add(strings.map((part, index) => part + (index < strings.length - 1 ? `{p${index}}` : '')).join(''), path);
        }
      }
      for (const attr of node.attributes ?? []) {
        if (textAttributes.has(attr.name)) add(attr.value, path);
      }
      if (process.argv.includes('--dynamic')) {
        for (const attr of node.inputs ?? []) {
          if (textAttributes.has(attr.name) && !attr.value.source.includes('| translate')) add(`[${attr.name}]=${attr.value.source}`, path);
        }
      }
      if (process.argv.includes('--literals')) {
        for (const attr of node.inputs ?? []) {
          if (textAttributes.has(attr.name) && !attr.value.source.includes('| translate')) {
            for (const literal of bindingLiterals(attr.value.ast)) add(literal, path);
          }
        }
      }
    });
  }
  const sorted = [...messages].sort(([a], [b]) => a.localeCompare(b));
  console.log(JSON.stringify(process.argv.includes('--keys') ? sorted.map(([key]) => key) : Object.fromEntries(sorted), null, 2));
}
