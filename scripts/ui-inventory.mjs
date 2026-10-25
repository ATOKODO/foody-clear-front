import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { BindingType, parseTemplate } from '@angular/compiler';

export const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);

// Angular 22 puts switch content in case groups, not in cases. Visit deferred
// branches and @empty too, including templates declared inline in TypeScript.
export function templateElements(template, file = 'inline.html') {
  const parsed = parseTemplate(template, file);
  assert(!parsed.errors?.length, `${file}: ${parsed.errors?.join('\n')}`);
  const elements = [];
  const visit = (node, context = { tableContext: null, insideEmptyState: false, summaryContainer: null, insideSummaryPill: false }) => {
    let childContext = context;
    if (node.constructor.name === 'Element') {
      const attributes = Object.fromEntries(node.attributes.map(attr => [attr.name, attr.value]));
      const inputs = Object.fromEntries(node.inputs.map(attr => [attr.name, attr.value.source]));
      const attrs = { ...attributes, ...inputs };
      const tableContext = node.name === 'table' ? ('mat-table' in attrs ? 'material' : 'native') : node.name === 'mat-table' ? 'material' : context.tableContext;
      elements.push({
        tag: node.name, line: node.sourceSpan.start.line + 1,
        attributes, inputs, tableContext, insideEmptyState: context.insideEmptyState,
        summaryContainer: context.summaryContainer, insideSummaryPill: context.insideSummaryPill,
        bindings: node.inputs.map(attribute => ({ name: attribute.name, kind: BindingType[attribute.type], expression: attribute.value.source })),
        text: (node.children ?? []).filter(child => ['Text', 'BoundText'].includes(child.constructor.name)).map(child => child.value?.source ?? child.value).join(' ').trim(),
      });
      childContext = {
        tableContext, insideEmptyState: context.insideEmptyState || 'appEmptyState' in attrs,
        summaryContainer: (attributes.class ?? '').match(/\b(?:inventory-summary|meal-prep-summary|shopping-list-summary)\b/)?.[0] ?? context.summaryContainer,
        insideSummaryPill: context.insideSummaryPill || 'appSummaryPill' in attrs,
      };
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

// Only explicit arguments on exported CSF stories count, not arbitrary props,
// metadata defaults or a helper object containing the same property name.
export function storyArgumentValues(content, argument) {
  const source = ts.createSourceFile('stories.ts', content, ts.ScriptTarget.Latest, true);
  const unwrap = node => node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node;
  const property = (node, key) => node && ts.isObjectLiteralExpression(node)
    ? node.properties.find(prop => ts.isPropertyAssignment(prop) && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) && prop.name.text === key)?.initializer
    : undefined;
  const values = new Set();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const value = property(unwrap(property(unwrap(declaration.initializer), 'args')), argument);
      if (value && ts.isStringLiteral(value)) values.add(value.text);
    }
  }
  return values;
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
    if (element.tag === ':svg:svg') categories.push(component.name === 'UiIcon' ? 'shared-icon-definition' : 'inline-icon');
    if (element.tag === 'app-icon') categories.push('shared-icon');
    if (element.tag === 'app-macro-progress-card') categories.push('shared-macro-progress-card');
    if (element.tag === 'app-action-card') categories.push('shared-action-card');
    if ('appDisclosure' in attrs) categories.push('shared-disclosure');
    if ('appDisclosureSummary' in attrs) categories.push('shared-disclosure-summary');
    if ('appStatusBadge' in attrs) categories.push('shared-status-badge');
    if ('appCalendarTag' in attrs) categories.push('shared-calendar-tag');
    if ('appCalendarPanel' in attrs) categories.push('shared-calendar-panel');
    if ('appBreakdownBadge' in attrs) categories.push('shared-breakdown-badge');
    if ('appBreakdownCard' in attrs) categories.push('shared-breakdown-card');
    if ('appRaisedPanel' in attrs) categories.push('shared-raised-panel');
    const hasModalShellClass = css.split(/\s+/).includes('app-modal-shell');
    if (hasModalShellClass) categories.push('shared-modal-shell');
    const hasModalCardClass = css.split(/\s+/).includes('app-modal-card');
    if (hasModalCardClass) categories.push('cataloged-modal-card-surface');
    if ('appOverviewMetric' in attrs) categories.push('shared-overview-metric');
    if ('appDateBadge' in attrs) categories.push('shared-date-badge');
    if ('appSelectableCard' in attrs) categories.push('shared-selectable-card');
    if ('appWorkspaceCard' in attrs) categories.push('shared-workspace-card');
    if ('appNutritionMetricCard' in attrs) categories.push('shared-nutrition-metric-card');
    if ('appSummaryPill' in attrs) categories.push('shared-summary-pill');
    else if (element.tag === 'span' && element.summaryContainer && !element.insideSummaryPill) categories.push('summary-pill-composition');
    const sharedBadge = ['appStatusBadge', 'appSummaryPill', 'appCalendarTag', 'appBreakdownBadge', 'appOverviewMetric', 'appDateBadge'].some(name => name in attrs);
    const sharedSelectableCard = 'appSelectableCard' in attrs;
    const sharedWorkspaceCard = 'appWorkspaceCard' in attrs;
    const sharedCalendarPanel = 'appCalendarPanel' in attrs;
    const sharedNutritionMetricCard = 'appNutritionMetricCard' in attrs;
    const sharedBreakdownCard = 'appBreakdownCard' in attrs;
    const sharedRaisedPanel = 'appRaisedPanel' in attrs;
    const catalogedModalCard = hasModalCardClass;
    const insideCatalogedUi = component.file?.includes('/src/app/ui/') ?? false;
    if (!sharedBadge && /\b[\w-]*(?:badge|chip|pill)\b/.test(css)) categories.push('badge-composition');
    if (!categories.includes('badge-composition') && !sharedBadge && ['span', 'em'].includes(element.tag) && element.text && /rounded-full|status/.test(css)) categories.push('status-or-utility-composition');
    if (!insideCatalogedUi && !hasModalShellClass && !categories.includes('shared-component') && !categories.includes('material') && element.bindings?.some(binding => ['Class', 'Style'].includes(binding.kind) || binding.kind === 'Attribute' && ['class', 'style', 'data-tone'].includes(binding.name))) categories.push('bound-visual-composition');
    const hasCardOrPanelRootClass = css.split(/\s+/).some(name => /(?:card|panel)(?:--[\w-]+)?$/.test(name) && !/(?:^|[-_])error-panel(?:--[\w-]+)?$/.test(name));
    if (!insideCatalogedUi && !sharedSelectableCard && !sharedWorkspaceCard && !sharedCalendarPanel && !sharedNutritionMetricCard && !sharedBreakdownCard && !sharedRaisedPanel && !catalogedModalCard && hasCardOrPanelRootClass) categories.push('surface-composition');
    if ('appEmptyState' in attrs) categories.push('shared-empty-state');
    else if (/\b[\w-]*empty[\w-]*\b/.test(css)) categories.push(element.insideEmptyState ? 'empty-state-content' : 'empty-state-composition');
    for (const [attribute, category] of [['appTable', 'shared-native-table'], ['appTableCell', 'shared-table-cell'], ['appTableScroll', 'shared-table-viewport']]) if (attribute in attrs) categories.push(category);
    if (!('appCalendarTag' in attrs) && /\b[\w-]*(?:alert|notice|warning|feedback)\b/.test(css)) categories.push('notice-composition');
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

export function assertSharedPrimitives(element, location = 'inline.html', { allowIconSvg = false } = {}) {
  const attrs = { ...element.attributes, ...element.inputs };
  const materialButtons = /^(?:mat-(?:stroked-button|raised-button|flat-button|button|icon-button|fab|mini-fab)|mat(?:Button|IconButton|Fab|MiniFab))$/;
  if (element.tag === 'button') {
    assert('appButton' in attrs, `${location}: raw button must use the shared UiButton component`);
    assert(!Object.keys(attrs).some(name => materialButtons.test(name)), `${location}: do not mix two button components on the same host`);
  }
  if (element.tag === 'input' || element.tag === 'textarea') assert('matInput' in attrs, `${location}: input must use the cataloged Material input directive`);
  if (/\b(?:app-status-pill|input-day-status)\b/.test(element.attributes.class ?? '')) assert('appStatusBadge' in attrs, `${location}: status badge must use UiStatusBadge`);
  if (/\b(?:template-master__count-badge|template-master__card-status|inventory-list-card__status|meal-prep-list-card__status|shopping-list-list-card__status|status-chip|home-day-entry__badge)\b/.test(element.attributes.class ?? '')) assert('appStatusBadge' in attrs, `${location}: migrated business status must use UiStatusBadge`);
  if (/\bcalendar-week-overview__pill\b/.test(element.attributes.class ?? '')) assert('appOverviewMetric' in attrs, `${location}: overview metric must use UiOverviewMetric`);
  if (/^(?:calendar-year-panel|calendar-month-panel|calendar-week-panel|calendar-day-panel)$/.test(element.attributes.class ?? '')) assert('appCalendarPanel' in attrs, `${location}: calendar view panel must use UiCalendarPanel`);
  if (/\bplanning-actions-modal__date-pill\b/.test(element.attributes.class ?? '')) assert('appDateBadge' in attrs, `${location}: date summary must use UiDateBadge`);
  if (/^(?:inventory-list-card|meal-prep-list-card|shopping-list-list-card)$/.test(element.attributes.class ?? '')) assert('appSelectableCard' in attrs, `${location}: selectable business card must use UiSelectableCard`);
  const workspaceCardClasses = new Set(['inventory-detail-card', 'meal-prep-editor-card', 'meal-prep-detail-card', 'shopping-list-editor-card', 'shopping-list-table-card', 'shopping-list-convert-card', 'shopping-list-template-create']);
  if ((element.attributes.class ?? '').split(/\s+/).some(name => workspaceCardClasses.has(name))) assert('appWorkspaceCard' in attrs, `${location}: workspace surface must use UiWorkspaceCard`);
  if ((element.attributes.class ?? '').split(/\s+/).includes('template-master__card')) assert('appSelectableCard' in attrs, `${location}: template selection card must use UiSelectableCard`);
  if (/\blc-macro-card\b/.test(element.attributes.class ?? '')) assert('appNutritionMetricCard' in attrs, `${location}: nutrition metric surface must use UiNutritionMetricCard`);
  if (/\blc-breakdown-card\b/.test(element.attributes.class ?? '')) assert('appBreakdownCard' in attrs, `${location}: nutrition breakdown surface must use UiBreakdownCard`);
  if (/(?:^|\s)planning-action-card(?:--[\w-]+)?(?:\s|$)/.test(element.attributes.class ?? '') && !location.startsWith('src/app/ui/action-card/')) assert(element.tag === 'app-action-card', `${location}: planning action-card composition must use UiActionCard`);
  const raisedPanelClasses = new Set(['home-dashboard__hero', 'home-panel', 'home-panel--schedule', 'home-panel--day-entries', 'home-panel--editor']);
  if ((element.attributes.class ?? '').split(/\s+/).some(name => raisedPanelClasses.has(name))) assert('appRaisedPanel' in attrs, `${location}: raised dashboard surface must use UiRaisedPanel`);
  if (/\b(?:calendar-year-card__status|calendar-year-chip|calendar-month-day__today-pill|calendar-week-grid__today-pill|calendar-week-mobile__today-pill|calendar-week-chip|calendar-week-meta-pill|calendar-month-day__alert-badge|calendar-day-summary__assignment-badge|calendar-day-summary__source-pill)\b/.test(element.attributes.class ?? '')) assert('appCalendarTag' in attrs, `${location}: calendar label must use UiCalendarTag`);
  if (/\b(?:lc-meta-chip|lc-overview-badge|lc-status-badge)\b/.test(element.attributes.class ?? '')) assert('appBreakdownBadge' in attrs, `${location}: cycle label must use UiBreakdownBadge`);
  if (element.tag === 'span' && element.summaryContainer && !element.insideSummaryPill || /\bmeal-prep-badge\b/.test(element.attributes.class ?? '')) assert('appSummaryPill' in attrs, `${location}: summary count/availability must use UiSummaryPill`);
  if (/(?:^|\s)app-alert(?:\s|$)/.test(element.attributes.class ?? '')) assert('appAlert' in attrs, `${location}: notice must use UiAlert`);
  if (element.tag === 'pre') assert('appCodePanel' in attrs, `${location}: preformatted content must use UiCodePanel`);
  if (element.tag === 'table' && !('mat-table' in attrs)) assert('appTable' in attrs, `${location}: native table must use UiTable`);
  if (['th', 'td'].includes(element.tag) && element.tableContext === 'native') {
    assert('appTableCell' in attrs, `${location}: native table cell must use UiTableCell`);
    assert(!('align' in attrs), `${location}: table cell alignment must use contentAlign`);
  }
  if (['p', 'div'].includes(element.tag) && /\b[\w-]*empty[\w-]*\b/.test(element.attributes.class ?? '') && !element.insideEmptyState) assert('appEmptyState' in attrs, `${location}: empty-state root must use UiEmptyState`);
  if (element.tag === ':svg:svg') assert(allowIconSvg, `${location}: glyph SVG must live in the shared UiIcon component`);
  if (element.tag === 'details') assert('appDisclosure' in attrs, `${location}: native disclosure must use UiDisclosure`);
  if (element.tag === 'summary') assert('appDisclosureSummary' in attrs, `${location}: native summary must use UiDisclosureSummary`);
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
