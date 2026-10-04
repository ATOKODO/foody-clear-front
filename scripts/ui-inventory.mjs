import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parseTemplate } from '@angular/compiler';

export const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);

// Angular 22 puts switch content in case groups, not in cases. Visit deferred
// branches and @empty too, including templates declared inline in TypeScript.
export function templateElements(template, file = 'inline.html') {
  const parsed = parseTemplate(template, file);
  assert(!parsed.errors?.length, `${file}: ${parsed.errors?.join('\n')}`);
  const elements = [];
  const visit = (node, context = { tableContext: null, insideEmptyState: false }) => {
    let childContext = context;
    if (node.constructor.name === 'Element') {
      const attributes = Object.fromEntries(node.attributes.map(attr => [attr.name, attr.value]));
      const inputs = Object.fromEntries(node.inputs.map(attr => [attr.name, attr.value.source]));
      const attrs = { ...attributes, ...inputs };
      const tableContext = node.name === 'table' ? ('mat-table' in attrs ? 'material' : 'native') : node.name === 'mat-table' ? 'material' : context.tableContext;
      elements.push({
        tag: node.name, line: node.sourceSpan.start.line + 1,
        attributes, inputs, tableContext, insideEmptyState: context.insideEmptyState,
        text: (node.children ?? []).filter(child => ['Text', 'BoundText'].includes(child.constructor.name)).map(child => child.value?.source ?? child.value).join(' ').trim(),
      });
      childContext = { tableContext, insideEmptyState: context.insideEmptyState || 'appEmptyState' in attrs };
    }
    for (const key of ['children', 'branches', 'groups', 'cases', 'blocks']) for (const child of node[key] ?? []) visit(child, childContext);
    for (const key of ['empty', 'placeholder', 'loading', 'error']) if (node[key]) visit(node[key], childContext);
  };
  parsed.nodes.forEach(node => visit(node));
  return elements;
}

export function componentTemplates(root = 'src') {
  const components = [];
  for (const file of walk(root).filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts'))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const node of source.statements) {
      if (!ts.isClassDeclaration(node) || !node.name) continue;
      for (const decorator of ts.getDecorators(node) ?? []) {
        if (!ts.isCallExpression(decorator.expression) || decorator.expression.expression.getText(source) !== 'Component') continue;
        const properties = decorator.expression.arguments[0]?.properties;
        assert(properties, `${file}: component metadata must be statically readable`);
        const metadata = new Map(properties.filter(ts.isPropertyAssignment).map(prop => [prop.name.getText(source), prop.initializer]));
        const templateUrl = metadata.get('templateUrl');
        const template = metadata.get('template');
        const templateFile = templateUrl ? resolve(dirname(file), templateUrl.text) : file;
        const content = templateUrl ? readFileSync(templateFile, 'utf8') : template?.text;
        assert.equal(typeof content, 'string', `${file}: template must be a file or a static literal`);
        components.push({
          name: node.name.text, file, templateFile, selector: metadata.get('selector')?.text,
          storyOnly: file.includes('/app/stories/'), elements: templateElements(content, templateFile),
        });
      }
    }
  }
  return components;
}

export function uiInventory(components = componentTemplates()) {
  const nativeControls = new Set(['button', 'input', 'textarea', 'select', 'table', 'details', 'a', 'video', 'img']);
  const rows = components.filter(component => !component.storyOnly).flatMap(component => component.elements.map(element => {
    const attrs = { ...element.attributes, ...element.inputs };
    const css = element.attributes.class ?? '';
    const categories = [];
    if (element.tag.startsWith('mat-') || Object.keys(attrs).some(attr => /^mat[A-Z]|^mat-/.test(attr))) categories.push('material');
    if (Object.keys(attrs).some(attr => /^app[A-Z]/.test(attr)) || element.tag.startsWith('app-')) categories.push('shared-component');
    if (nativeControls.has(element.tag)) categories.push('native-control');
    if (element.tag === ':svg:svg') categories.push('inline-icon');
    if (/\b[\w-]*(?:badge|chip|pill)\b/.test(css)) categories.push('badge-composition');
    if (/\b[\w-]*(?:card|panel)\b/.test(css)) categories.push('surface-composition');
    if ('appEmptyState' in attrs) categories.push('shared-empty-state');
    else if (/\b[\w-]*empty[\w-]*\b/.test(css)) categories.push(element.insideEmptyState ? 'empty-state-content' : 'empty-state-composition');
    for (const [attribute, category] of [['appTable', 'shared-native-table'], ['appTableCell', 'shared-table-cell'], ['appTableScroll', 'shared-table-viewport']]) if (attribute in attrs) categories.push(category);
    if (/\b[\w-]*(?:alert|notice|warning)\b/.test(css)) categories.push('notice-composition');
    return { owner: component.name, file: relative('.', component.templateFile), ...element, categories };
  })).filter(element => element.categories.length);
  return {
    components: components.filter(component => !component.storyOnly).length,
    templateElements: components.filter(component => !component.storyOnly).reduce((total, component) => total + component.elements.length, 0),
    tags: Object.fromEntries([...new Set(rows.map(row => row.tag))].sort().map(tag => [tag, rows.filter(row => row.tag === tag).length])),
    categories: Object.fromEntries([...new Set(rows.flatMap(row => row.categories))].sort().map(category => [category, rows.filter(row => row.categories.includes(category)).length])),
    elements: rows,
  };
}

export function assertSharedPrimitives(element, location = 'inline.html') {
  const attrs = { ...element.attributes, ...element.inputs };
  const materialButtons = /^(?:mat-(?:stroked-button|raised-button|flat-button|button|icon-button|fab|mini-fab)|mat(?:Button|IconButton|Fab|MiniFab))$/;
  if (element.tag === 'button') {
    assert('appButton' in attrs, `${location}: raw button must use the shared UiButton component`);
    assert(!Object.keys(attrs).some(name => materialButtons.test(name)), `${location}: do not mix two button components on the same host`);
  }
  if (element.tag === 'input' || element.tag === 'textarea') assert('matInput' in attrs, `${location}: input must use the cataloged Material input directive`);
  if (/\bapp-status-pill\b/.test(element.attributes.class ?? '')) assert('appStatusBadge' in attrs, `${location}: status badge must use UiStatusBadge`);
  if (/(?:^|\s)app-alert(?:\s|$)/.test(element.attributes.class ?? '')) assert('appAlert' in attrs, `${location}: notice must use UiAlert`);
  if (element.tag === 'pre') assert('appCodePanel' in attrs, `${location}: preformatted content must use UiCodePanel`);
  if (element.tag === 'table' && !('mat-table' in attrs)) assert('appTable' in attrs, `${location}: native table must use UiTable`);
  if (['th', 'td'].includes(element.tag) && element.tableContext === 'native') {
    assert('appTableCell' in attrs, `${location}: native table cell must use UiTableCell`);
    assert(!('align' in attrs), `${location}: table cell alignment must use contentAlign`);
  }
  if (['p', 'div'].includes(element.tag) && /\b[\w-]*empty[\w-]*\b/.test(element.attributes.class ?? '') && !element.insideEmptyState) assert('appEmptyState' in attrs, `${location}: empty-state root must use UiEmptyState`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inventory = uiInventory();
  if (process.argv.includes('--json')) console.log(JSON.stringify(inventory, null, 2));
  else {
    console.log(`UI audit: ${inventory.components} production components; ${inventory.templateElements} template elements.`);
    console.table(inventory.categories);
    console.log('This is a source inventory, not proof of standalone story coverage. Composition candidates still require review. Use --json for owners, source locations, attributes and text.');
  }
}
