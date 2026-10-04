import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import ts from 'typescript';
import { assertSharedPrimitives, componentTemplates } from './ui-inventory.mjs';

const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);
const parse = file => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const components = new Map();
let buttons = 0;
let feedback = 0;
for (const component of componentTemplates()) {
  for (const element of component.elements) {
    const attrs = { ...element.attributes, ...element.inputs };
    const location = `${relative('.', component.templateFile)}:${element.line}`;
    assertSharedPrimitives(element, location);
    if (element.tag === 'button') buttons++;
    if (['appStatusBadge', 'appAlert', 'appCodePanel'].some(name => name in attrs)) feedback++;
  }
}
for (const file of walk('src').filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.includes('/stories/'))) {
  for (const node of parse(file).statements) {
    if (!ts.isClassDeclaration(node) || !node.name) continue;
    if (ts.getDecorators(node)?.some(decorator => ts.isCallExpression(decorator.expression) && decorator.expression.expression.getText() === 'Component')) {
      components.set(file, node.name.text);
    }
  }
}
const covered = new Set();
let storyCount = 0;
for (const file of walk('stories').filter(file => file.endsWith('.stories.ts'))) {
  const source = parse(file);
  const imports = new Map();
  for (const node of source.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      for (const name of node.importClause.namedBindings.elements) imports.set(name.name.text, resolve(dirname(file), node.moduleSpecifier.text + '.ts'));
    }
    if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) storyCount += node.declarationList.declarations.length;
  }
  const visit = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'component' && ts.isIdentifier(node.initializer)) {
      const componentFile = imports.get(node.initializer.text);
      if (components.has(componentFile)) covered.add(componentFile);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert(source.statements.some(node => ts.isExportAssignment(node)), `${relative('.', file)} needs a default CSF meta export`);
}
const missing = [...components].filter(([file]) => !covered.has(file));
assert.equal(missing.length, 0, `Production components missing stories:\n${missing.map(([file, name]) => `${name}: ${relative('.', file)}`).join('\n')}`);
const modal = readFileSync('stories/ui/UiModal.stories.ts', 'utf8');
assert(/imports:\s*\[UiModal\b/.test(modal) && modal.includes('appModalClose'), 'The modal directive needs an interactive usage story');
assert(readFileSync('src/app/stories/foundations/foundations.ts', 'utf8').includes('_tokens.scss?raw'), 'Foundations must read the real design tokens');
assert(!readFileSync('src/main.ts', 'utf8').includes('stories'), 'Storybook must not enter the app bootstrap');
console.log(`Storybook inventory: ${covered.size}/${components.size} production components + UiModal; ${storyCount} stories; ${buttons} shared buttons; ${feedback} shared feedback instances (production and previews).`);
