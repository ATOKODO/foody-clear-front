import { readFileSync } from 'node:fs';
import { relative, dirname } from 'node:path';
import { parseTemplate } from '@angular/compiler';
import ts from 'typescript';
import { sourceFiles, walkTemplate, normalizeMessage, humanText, textAttributes } from './i18n-inventory.mjs';

const catalogPath = 'src/app/i18n/messages.ts';
const catalog = ts.createSourceFile(catalogPath, readFileSync(catalogPath, 'utf8'), ts.ScriptTarget.Latest, true);
const keys = new Set();
const patches = [];
function visitTs(node) {
  if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) keys.add(node.name.text);
  ts.forEachChild(node, visitTs);
}
visitTs(catalog);
const quote = (value) => JSON.stringify(value);
const attrQuote = (value) => quote(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
// Only application-owned labels, never product/recipe/inventory names or titles.
const uiBindings = new Set([
  'option.label', 'unit.label', 'reference.label', 'view.label', 'preset.label',
  'status.label', 'metric.label', 'card.label', 'card.caption', 'macro.label',
  'activeViewConfig.title', 'activeViewConfig.addLabel', 'formDialogTitle',
  'formDialogSubtitle', 'store.dialogTitle()', 'store.dialogSubtitle()',
  'heading', 'subtitle', 'sideTitle()', 'ariaLabel()', 'detailAriaLabel()', 'sideAriaLabel()',
  'addProductsFormError', 'createProductsFormError', 'manageProductsFormError',
  'initialDateError', 'itemEditorError', 'itemError', 'itemsFormError',
  'templateActionError', 'templateError', 'cameraError()', 'jsonResult().error',
  'importNotice', 'shoppingListFeedback', 'entry.paymentLabel', 'entry.key',
  'nutritionLabels[value.nutritionKey] || value.nutritionKey', 'nutrition.key', 'target.key',
  'getDayTargetHeadline()', 'getDayTargetSourcePillText(targetSource)',
  'getDayTargetSupportingText()', 'getDayTemplateBlockEmptyText(block)',
  'getPurchaseEventLabel(event)', 'getPurchaseEventStatusLabel(event)',
  'getStatusLabel(card.status)', 'getStatusLabel(metric.status)',
  'getStockAvailabilityLabel(item)', 'getTargetSourceBadgeText(targetSource)',
  "getTargetSourceText(template.totalsMacros?.targetSource ?? 'none')",
  'getTargetSourceText(totals.targetSource)', 'getTemplateStockLabel(item)',
  'getTemplateTargetSourceText(projectedTotals)', 'getViewLabel(view)',
  'resolveTemplateItemTypeLabel(item)', 'resolveTypeLabel(item.itemType)',
  'createSelectedItemsLabel', 'row.qtyUnitHelpText', 'getMonthDayType(day)',
  'badge.text', 'assignmentHighlight.progress', 'getToggleLabel(cycle.id)',
  'templateSource', 'block.rangeLabel', 'group.rangeLabel', 'row.rangeLabel',
  'unitType', 'portionUnit', 'quantityUnit', 'unit', 'item.qtyUnit',
  "item.qtyUnit ?? '-'", 'item.qtyUnit ?? "-"',
  'formatDuration( cycle.durationCount, cycle.durationType )',
]);
function displayLiterals(expression) {
  if (expression.includes('| translate') || /setLocale|toFormat/.test(expression)) return expression;
  return expression.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, (token, offset) => {
    // Enum comparisons are business logic, not displayed translations.
    if (/(?:===|!==|==|!=)\s*$/.test(expression.slice(0, offset)) ||
        /^\s*(?:===|!==|==|!=)/.test(expression.slice(offset + token.length))) return token;
    const parsed = ts.createSourceFile('literal.ts', `const value = ${token};`, ts.ScriptTarget.Latest, true);
    const original = parsed.statements[0]?.declarationList?.declarations[0]?.initializer?.text;
    if (typeof original !== 'string') return token;
    const key = normalizeMessage(original);
    if (!keys.has(key) || !humanText(key)) return token;
    const leading = original.match(/^\s*/)[0];
    const trailing = original.match(/\s*$/)[0];
    const translated = `(${quote(key)} | translate)`;
    return leading || trailing ? `(${quote(leading)} + ${translated} + ${quote(trailing)})` : translated;
  });
}
function diffHunks(before, after) {
  const a = before.replace(/\n$/, '').split('\n');
  const b = after.replace(/\n$/, '').split('\n');
  const rows = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      rows[i][j] = a[i] === b[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1]);
    }
  }
  const operations = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) operations.push(' ' + a[i++]), j++;
    else if (j < b.length && (i === a.length || rows[i][j + 1] > rows[i + 1][j])) operations.push('+' + b[j++]);
    else operations.push('-' + a[i++]);
  }
  const ranges = [];
  operations.forEach((operation, index) => {
    if (operation.startsWith(' ')) return;
    const start = Math.max(0, index - 2);
    const end = Math.min(operations.length, index + 3);
    const previous = ranges.at(-1);
    if (previous && start <= previous[1]) previous[1] = end;
    else ranges.push([start, end]);
  });
  return ranges.map(([start, end]) => '@@\n' + operations.slice(start, end).join('\n')).join('\n');
}
const apply = (path, before, after) => {
  if (before === after) return;
  if (!process.argv.includes('--patches')) { console.log(path); return; }
  patches.push(`*** Begin Patch\n*** Update File: ${path}\n${diffHunks(before, after)}\n*** End Patch\n`);
};

const requested = process.argv.find((argument) => argument.startsWith('--file='))?.slice(7);
for (const path of sourceFiles().filter((path) => path.endsWith('.html') && path !== 'src/index.html' && (!requested || path === requested))) {
  const source = readFileSync(path, 'utf8');
  const template = parseTemplate(source, path);
  if (template.errors?.length) throw new Error(`${path}: ${template.errors}`);
  const edits = [];
  walkTemplate(template.nodes, (node, ancestors) => {
    if (ancestors.some((parent) => ['pre', 'code', 'svg'].includes(parent.name))) return;
    const start = node.sourceSpan.start.offset;
    const end = node.sourceSpan.end.offset;
    if (node.constructor.name === 'Text') {
      const key = normalizeMessage(node.value);
      if (keys.has(key) && humanText(key)) {
        const raw = source.slice(start, end);
        edits.push([start, end, raw.replace(raw.trim(), `{{ ${quote(key)} | translate }}`)]);
      }
    }
    if (node.constructor.name === 'BoundText' && node.value.ast.strings) {
      const { strings } = node.value.ast;
      const key = normalizeMessage(strings.map((part, index) => part + (index < strings.length - 1 ? `{p${index}}` : '')).join(''));
      if (keys.has(key) && strings.some((part) => humanText(part.trim()))) {
        const raw = source.slice(start, end);
        const expressions = [...raw.matchAll(/\{\{([\s\S]*?)\}\}/g)].map((match) => match[1].trim());
        const parameters = expressions.map((expression, index) => `p${index}: (${expression})`).join(', ');
        const replacement = `{{ ${quote(key)} | translate: { ${parameters} } }}`;
        edits.push([start, end, raw.replace(raw.trim(), replacement)]);
      } else {
        const raw = source.slice(start, end);
        const replaced = raw.replace(/\{\{([\s\S]*?)\}\}/g, (match, expression) =>
          uiBindings.has(normalizeMessage(expression)) ? `{{ (${expression.trim()}) | translate }}` : `{{${displayLiterals(expression)}}}`,
        );
        if (replaced !== raw) edits.push([start, end, replaced]);
      }
    }
    for (const attr of node.attributes ?? []) {
      const key = normalizeMessage(attr.value);
      if (textAttributes.has(attr.name) && keys.has(key)) {
        const binding = attr.name === 'aria-label' ? 'attr.aria-label' : attr.name;
        edits.push([attr.sourceSpan.start.offset, attr.sourceSpan.end.offset, `[${binding}]="${attrQuote(key)} | translate"`]);
      }
    }
    for (const attr of node.inputs ?? []) {
      if (!textAttributes.has(attr.name)) continue;
      const expression = uiBindings.has(attr.value.source.trim())
        ? `(${attr.value.source}) | translate` : displayLiterals(attr.value.source);
      if (expression === attr.value.source) continue;
      const binding = attr.name === 'aria-label' && attr.type === 1 ? 'attr.aria-label' : attr.name;
      edits.push([attr.sourceSpan.start.offset, attr.sourceSpan.end.offset, `[${binding}]="${expression.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`]);
    }
  });
  if (!edits.length) continue;
  let updated = source;
  // Structural directives mirror attributes on both the template and element.
  const uniqueEdits = [...new Map(edits.map((edit) => [edit.slice(0, 2).join(':'), edit])).values()];
  for (const [start, end, text] of uniqueEdits.sort((a, b) => b[0] - a[0])) updated = updated.slice(0, start) + text + updated.slice(end);
  apply(path, source, updated);
  const componentPath = path.replace(/\.html$/, '.ts');
  let component = readFileSync(componentPath, 'utf8');
  if (!component.includes("import { TranslatePipe }")) {
    const imported = relative(dirname(componentPath), 'src/app/i18n/translate-pipe').replaceAll('\\', '/');
    const before = component;
    component = `import { TranslatePipe } from '${imported.startsWith('.') ? imported : './' + imported}';\n` + component;
    if (/imports\s*:\s*\[/.test(component)) {
      component = component.replace(/imports\s*:\s*\[/, (opening, offset) =>
        opening + (component[offset + opening.length] === '\n' ? '\n    TranslatePipe,' : 'TranslatePipe, '),
      );
    }
    else component = component.replace(/@Component\(\{/, '$&\n  imports: [TranslatePipe],');
    apply(componentPath, before, component);
  }
}
if (process.argv.includes('--patches')) console.log(JSON.stringify(patches));
