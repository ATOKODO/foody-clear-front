import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import ts from 'typescript';
import { assertSharedPrimitives, componentTemplates, storyArgumentValues } from './ui-inventory.mjs';

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
    assertSharedPrimitives(element, location, { allowIconSvg: resolve(component.file) === resolve('src/app/ui/icon/icon.ts') });
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
// A generic icon component story alone does not cover newly registered glyphs.
const unwrap = node => ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;
const glyphSource = parse('src/app/ui/icon/glyphs.ts');
const glyphs = glyphSource.statements.filter(ts.isVariableStatement).flatMap(statement => statement.declarationList.declarations).find(declaration => declaration.name.getText(glyphSource) === 'UI_ICONS');
assert(glyphs?.initializer && ts.isObjectLiteralExpression(unwrap(glyphs.initializer)), 'Local icon registry must be statically readable');
const glyphNames = unwrap(glyphs.initializer).properties.map(property => property.name.getText(glyphSource));
const coveredGlyphs = storyArgumentValues(readFileSync('stories/ui/UiIcon.stories.ts', 'utf8'), 'name');
assert(glyphNames.every(name => coveredGlyphs.has(name)), `Local glyphs missing dedicated icon story args: ${glyphNames.filter(name => !coveredGlyphs.has(name)).join(', ')}`);
function assertVariantCoverage(componentFile, storyFile, axes) {
  const source = parse(componentFile);
  const stories = readFileSync(storyFile, 'utf8');
  for (const [typeName, argument] of axes) {
    const alias = source.statements.find(node => ts.isTypeAliasDeclaration(node) && node.name.text === typeName);
    assert(alias && ts.isUnionTypeNode(alias.type) && alias.type.types.every(type => ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)), `${typeName} must be a statically readable variant union`);
    const variants = alias.type.types.map(type => type.literal.text);
    const coveredVariants = storyArgumentValues(stories, argument);
    assert(variants.every(variant => coveredVariants.has(variant)), `${typeName} ${argument} variants missing dedicated story args: ${variants.filter(variant => !coveredVariants.has(variant)).join(', ')}`);
  }
}
assertVariantCoverage('src/app/ui/status-badge/status-badge.ts', 'stories/ui/UiStatusBadge.stories.ts', [['StatusTone', 'tone'], ['BadgeSize', 'size'], ['BadgeEmphasis', 'emphasis'], ['BadgeAppearance', 'appearance']]);
assertVariantCoverage('src/app/ui/calendar-tag/calendar-tag.ts', 'stories/ui/UiCalendarTag.stories.ts', [['CalendarTagVariant', 'variant'], ['CalendarTagTone', 'tone'], ['CalendarTagContext', 'context']]);
assertVariantCoverage('src/app/ui/breakdown-badge/breakdown-badge.ts', 'stories/ui/UiBreakdownBadge.stories.ts', [['BreakdownBadgeKind', 'kind'], ['BreakdownStatus', 'status']]);
assertVariantCoverage('src/app/ui/action-card/action-card.ts', 'stories/ui/UiActionCard.stories.ts', [['ActionCardTone', 'tone']]);
assertVariantCoverage('src/app/ui/chart-bar/chart-bar.ts', 'stories/ui/UiChartBar.stories.ts', [['ChartBarVariant', 'variant']]);
assertVariantCoverage('src/app/ui/button/button.ts', 'stories/ui/UiButton.stories.ts', [['ButtonVariant', 'variant'], ['ButtonSize', 'size']]);
assertVariantCoverage('src/app/ui/button/button.ts', 'stories/ui/UiButton.stories.ts', [['ButtonType', 'type']]);
assertVariantCoverage('src/app/ui/alert/alert.ts', 'stories/ui/UiAlert.stories.ts', [['AlertTone', 'tone']]);
assertVariantCoverage('src/app/ui/disclosure/disclosure.ts', 'stories/ui/UiDisclosure.stories.ts', [['DisclosureAppearance', 'appearance']]);
assertVariantCoverage('src/app/ui/disclosure-summary/disclosure-summary.ts', 'stories/ui/UiDisclosureSummary.stories.ts', [['DisclosureSummarySize', 'size'], ['DisclosureSummaryEmphasis', 'emphasis']]);
assertVariantCoverage('src/app/ui/empty-state/empty-state.ts', 'stories/ui/UiEmptyState.stories.ts', [['EmptyStateAppearance', 'appearance'], ['EmptyStateSize', 'size'], ['EmptyStateTone', 'tone']]);
assertVariantCoverage('src/app/ui/icon/icon.ts', 'stories/ui/UiIcon.stories.ts', [['IconSize', 'size']]);
assertVariantCoverage('src/app/ui/table/table.ts', 'stories/ui/UiTable.stories.ts', [['TableDensity', 'density'], ['TableLayout', 'layout']]);
assertVariantCoverage('src/app/ui/table-cell/table-cell.ts', 'stories/ui/UiTableCell.stories.ts', [['TableCellContentAlign', 'contentAlign']]);
assertVariantCoverage('src/app/ui/breakdown-card/breakdown-card.ts', 'stories/ui/UiBreakdownCard.stories.ts', [['BreakdownCardDensity', 'density']]);
assertVariantCoverage('src/app/ui/macro-progress-card/macro-progress-card.ts', 'stories/ui/UiMacroProgressCard.stories.ts', [['MacroProgressStatus', 'status']]);
assertVariantCoverage('src/app/ui/selectable-card/selectable-card.ts', 'stories/ui/UiSelectableCard.stories.ts', [['SelectableCardTone', 'tone']]);
for (const [component, story, type] of [
  ['category/category-form', 'CategoryForm', 'CategoryFormMode'],
  ['day-set/day-set-form', 'DaySetForm', 'DaySetFormMode'],
  ['cycle/form-cycle', 'FormCycle', 'CycleFormMode'],
  ['generic-product/generic-product-form', 'GenericProductForm', 'GenericProductFormMode'],
  ['inventory/inventory-form', 'InventoryForm', 'InventoryFormMode'],
  ['product/product-form', 'ProductForm', 'ProductFormMode'],
  ['slot/slot-form', 'SlotForm', 'SlotFormMode'],
  ['tag/tag-form', 'TagForm', 'TagFormMode'],
  ['template/template-form', 'TemplateForm', 'TemplateFormMode'],
]) assertVariantCoverage(`src/components/${component}/${component.split('/').at(-1)}.ts`, `stories/components/${story}.stories.ts`, [[type, 'mode']]);
for (const [component, story, type] of [
  ['category/category-list', 'CategoryList', 'CategoryListMode'],
  ['day-set/day-set-list', 'DaySetList', 'DaySetListMode'],
  ['cycle/list-cycle', 'ListCycle', 'CycleListMode'],
  ['generic-product/generic-product-list', 'GenericProductList', 'GenericProductListMode'],
  ['inventory/inventory-list', 'InventoryList', 'InventoryListMode'],
  ['product/product-list', 'ProductList', 'ProductListMode'],
  ['slot/slot-list', 'SlotList', 'SlotListMode'],
  ['tag/tag-list', 'TagList', 'TagListMode'],
]) assertVariantCoverage(`src/components/${component}/${component.split('/').at(-1)}.ts`, `stories/components/${story}.stories.ts`, [[type, 'mode']]);
const modal = readFileSync('stories/ui/UiModal.stories.ts', 'utf8');
assert(/imports:\s*\[UiModal\b/.test(modal) && modal.includes('appModalClose') && modal.includes('app-modal-shell'), 'The modal directive and shared shell need an interactive usage story');
assert(modal.includes('FocusAfterContentChange') && modal.includes('replace-focused-action') && modal.includes('replacement-editor-input') && modal.includes('document.activeElement'), 'The modal stories must cover focus after dynamic content replacement');
const modalCardSurface = readFileSync('stories/ui/ModalCardSurface.stories.ts', 'utf8');
assert(modalCardSurface.includes('MatCardModule') && modalCardSurface.includes('app-modal-card') && modalCardSurface.includes('app-modal-card--wide') && modalCardSurface.includes('LongContent'), 'The shared Material modal-card surface story must cover standard, wide and long-content appearances');
for (const [file, dialogId, className] of [
  ['stories/screens/DaySetFeature.stories.ts', 'day-set-dialog', 'app-modal-shell--embedded-day-set'],
  ['stories/screens/SlotFeature.stories.ts', 'slot-dialog', 'app-modal-shell--embedded-slot'],
]) {
  const story = readFileSync(file, 'utf8');
  assert(story.includes('export const EmbeddedDialog') && story.includes(dialogId) && story.includes(className), `${file} must exercise its embedded dialog shell in an integration story`);
}
assert(readFileSync('src/app/stories/foundations/foundations.ts', 'utf8').includes('_tokens.scss?raw'), 'Foundations must read the real design tokens');
assert(!readFileSync('src/main.ts', 'utf8').includes('stories'), 'Storybook must not enter the app bootstrap');
console.log(`Storybook inventory: ${covered.size}/${components.size} production components + UiModal; ${storyCount} stories; ${buttons} shared buttons; ${feedback} shared feedback instances (production and previews).`);
