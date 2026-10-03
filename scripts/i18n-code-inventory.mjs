import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { sourceFiles, normalizeMessage } from './i18n-inventory.mjs';

const messages = new Map();
for (const path of sourceFiles().filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.includes('/i18n/'))) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  function add(text, node) {
    const key = normalizeMessage(text);
    if (!/[a-zA-ZÀ-ÿ]/.test(key) || /^https?:|^\.{0,2}\/|<[^>]+>|^#[a-z\d]+$/i.test(key)) return;
    const label = ts.isPropertyAssignment(node.parent) && /^(?:label|title|description|message)$/.test(node.parent.name.getText(source));
    if (!label && !/^[A-ZÀ-Ý]|[À-ÿ]|\s/.test(key)) return;
    if (/^(?:[a-z\d]+[-:][^\s]+\s*)+$/.test(key) || /^[A-ZdMLHhmsEcy\s,./:-]+$/.test(key)) return;
    messages.set(key, [...new Set([...(messages.get(key) ?? []), path])]);
  }
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) add(node.text, node);
    }
    if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
      add(parts.map((part, index) => part + (index < parts.length - 1 ? `{p${index}}` : '')).join(''), node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const sorted = [...messages].sort(([a], [b]) => a.localeCompare(b));
console.log(JSON.stringify(process.argv.includes('--keys') ? sorted.map(([key]) => key) : Object.fromEntries(sorted), null, 2));
