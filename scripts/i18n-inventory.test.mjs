import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTemplate } from '@angular/compiler';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { humanText, sourceFiles, textAttributes, walkTemplate } from './i18n-inventory.mjs';

test('visits nested Angular 22 switch groups and all conditional branches', () => {
  const template = parseTemplate(`
    @switch (view) {
      @case ('day') { <p>Day branch</p> }
      @default { @if (loading) { <span>Loading branch</span> } @else { <p>Ready branch</p> } }
    }
    @for (item of items; track item.id) { <p>Item branch</p> } @empty { <p>Empty branch</p> }
  `, 'inventory-test.html');
  assert.equal(template.errors, null);
  const texts = [];
  walkTemplate(template.nodes, (node) => {
    if (node.constructor.name === 'Text' && node.value.trim()) texts.push(node.value.trim());
  });
  assert.deepEqual(texts, ['Day branch', 'Loading branch', 'Ready branch', 'Item branch', 'Empty branch']);
});

test('application templates contain no untranslated static UI copy', () => {
  const remaining = [];
  for (const path of sourceFiles().filter((path) => path.endsWith('.html') && path !== 'src/index.html')) {
    const template = parseTemplate(readFileSync(path, 'utf8'), path);
    assert.equal(template.errors, null, path);
    walkTemplate(template.nodes, (node, ancestors) => {
      if (ancestors.some((ancestor) => ['pre', 'code', 'svg'].includes(ancestor.name))) return;
      if (node.constructor.name === 'Text' && humanText(node.value.trim())) {
        remaining.push(`${path}: ${node.value.trim()}`);
      }
      for (const attribute of node.attributes ?? []) {
        if (textAttributes.has(attribute.name) && humanText(attribute.value)) {
          remaining.push(`${path}: ${attribute.name}=${attribute.value}`);
        }
      }
    });
  }
  assert.deepEqual(remaining, [], 'New UI copy must use the bilingual catalog and translate pipe');
});

test('literal translation keys used by templates exist in the catalog', () => {
  const catalog = new Set();
  const source = ts.createSourceFile('messages.ts', readFileSync('src/app/i18n/messages.ts', 'utf8'), ts.ScriptTarget.Latest, true);
  function collect(node) {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) catalog.add(node.name.text);
    ts.forEachChild(node, collect);
  }
  collect(source);
  const missing = new Set();
  function inspect(value, path) {
    if (!value || typeof value !== 'object') return;
    if (value.constructor.name === 'BindingPipe' && value.name === 'translate' &&
        value.exp.constructor.name === 'LiteralPrimitive' && typeof value.exp.value === 'string' &&
        !catalog.has(value.exp.value)) {
      missing.add(`${path}: ${value.exp.value}`);
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach((entry) => inspect(entry, path));
      else inspect(child, path);
    }
  }
  for (const path of sourceFiles().filter((path) => path.endsWith('.html'))) {
    const template = parseTemplate(readFileSync(path, 'utf8'), path);
    walkTemplate(template.nodes, (node) => {
      if (node.constructor.name === 'BoundText') inspect(node.value.ast, path);
      for (const input of node.inputs ?? []) inspect(input.value.ast, path);
    });
  }
  assert.deepEqual([...missing], [], 'Translation pipes must reference existing catalog entries');
});
