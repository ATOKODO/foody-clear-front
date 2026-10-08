import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSharedPrimitives, componentTemplates, storyArgumentValues, templateElements, uiInventory } from './ui-inventory.mjs';

test('visits all conditional, switch-group, loop-empty and deferred template branches', () => {
  const template = `
    @if (open) { <button appButton>Open</button> } @else { <input matInput /> }
    @switch (mode) { @case ('day') { <textarea matInput></textarea> } @default { <table></table> } }
    @for (item of items; track item) { <span appStatusBadge>Item</span> } @empty { <p>No items</p> }
    @defer { <div appAlert>Notice</div> } @placeholder { <b>Placeholder</b> } @loading { <i>Loading</i> } @error { <strong>Error</strong> }
  `;
  assert.deepEqual(templateElements(template).map(element => element.tag).sort(), ['b', 'button', 'div', 'i', 'input', 'p', 'span', 'strong', 'table', 'textarea'].sort());
});

test('does not silently skip malformed templates', () => {
  assert.throws(() => templateElements('</div>'), /inline.html/);
});

test('rejects component bypasses and all conflicting Material button spellings', () => {
  for (const attribute of ['mat-mini-fab', 'mat-fab', 'mat-icon-button', 'mat-stroked-button', 'mat-raised-button', 'mat-flat-button', 'mat-button', 'matButton', 'matMiniFab', 'matFab', 'matIconButton']) {
    const [element] = templateElements(`<button appButton ${attribute}>Add</button>`);
    assert.throws(() => assertSharedPrimitives(element), /two button components/);
  }
  for (const template of ['<button>Save</button>', '<input />', '<textarea></textarea>', '<pre>Code</pre>', '<span class="app-status-pill">Saved</span>', '<p class="app-alert">Notice</p>']) {
    assert.throws(() => assertSharedPrimitives(templateElements(template)[0]));
  }
  for (const element of templateElements('<button appButton>Save</button><input matInput /><span appStatusBadge>Saved</span><p appAlert>Notice</p><pre appCodePanel>Code</pre>')) assertSharedPrimitives(element);
});

test('includes inline production templates but excludes previews from the production report', () => {
  const components = componentTemplates();
  assert(components.find(component => component.name === 'UiErrorPanel').elements.some(element => element.tag === 'pre'));
  const inventory = uiInventory(components);
  assert(!inventory.elements.some(element => element.owner === 'MaterialPreview' || element.owner === 'Foundations'));
  assert(inventory.elements.some(element => element.owner === 'Calendar' && element.tag === 'button'));
  assert(inventory.elements.some(element => element.owner === 'InputDayFeature' && element.tag === 'table'));
});

test('keeps native and Material table ancestry through conditional branches', () => {
  const native = templateElements('<table appTable><tbody>@if (ready) { <tr><td appTableCell>Product</td></tr> }</tbody></table>');
  const material = templateElements('<table mat-table><ng-container matColumnDef="name"><td mat-cell *matCellDef="let row">Product</td></ng-container></table>');
  assert.equal(native.find(element => element.tag === 'td').tableContext, 'native');
  assert.equal(material.find(element => element.tag === 'td').tableContext, 'material');
  for (const element of [...native, ...material]) assertSharedPrimitives(element);
  for (const template of ['<table></table>', '<table appTable><tr><td>Missing shared cell</td></tr></table>', '<table appTable><tr><td appTableCell align="right">Legacy alignment</td></tr></table>']) {
    assert.throws(() => templateElements(template).forEach(element => assertSharedPrimitives(element)));
  }
});

test('distinguishes a shared empty-state root from projected copy without masking raw roots', () => {
  const elements = templateElements('<div appEmptyState class="calendar-day-empty">@if (ready) { <p class="calendar-day-empty__text">No entries</p> }</div><p class="raw-empty">Missing shared state</p>');
  assertSharedPrimitives(elements[0]);
  assertSharedPrimitives(elements[1]);
  assert.throws(() => assertSharedPrimitives(elements[2]), /empty-state root/);
  const inventory = uiInventory([{ name: 'Host', storyOnly: false, templateFile: 'host.html', elements }]);
  assert.equal(inventory.categories['shared-empty-state'], 1);
  assert.equal(inventory.categories['empty-state-content'], 1);
  assert.equal(inventory.categories['empty-state-composition'], 1);
});

test('rejects glyph/disclosure bypasses while preserving the dedicated SVG implementation', () => {
  for (const template of ['<svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>', '<details><summary>Stock</summary></details>', '<details appDisclosure><summary>Stock</summary></details>']) {
    assert.throws(() => templateElements(template).forEach(element => assertSharedPrimitives(element)));
  }
  const [svg] = templateElements('<svg></svg>');
  assertSharedPrimitives(svg, 'icon.ts', { allowIconSvg: true });
  for (const element of templateElements('<app-icon name="today"/><details appDisclosure><summary appDisclosureSummary>Stock</summary></details>')) assertSharedPrimitives(element);
});

test('glyph coverage counts exported CSF args, not metadata defaults or arbitrary helper/render props', () => {
  const content = `
    const meta = { args: { name: 'metadata-only' } }; export default meta;
    const helper = { args: { name: 'not-exported' } };
    export const Day = { args: { name: 'today' } };
    export const Cycle = ({ args: { 'name': 'autorenew' } } satisfies Story);
    export const RenderOnly = { render: () => ({ props: { name: 'render-only' } }) };
  `;
  assert.deepEqual([...storyArgumentValues(content, 'name')], ['today', 'autorenew']);
});

test('reports class/style binding kinds and status/utility candidates outside the original class-name heuristic', () => {
  const elements = templateElements(`
    <span class="rounded-full px-2 py-1" [class.stock-ok]="inStock" [style.color]="color" [attr.data-tone]="tone">Stock OK</span>
    <span class="app-tone-swatch rounded-full" [attr.data-tone]="tone"></span>
    <span class="inventory-list-card__status">Stocked</span>
    <span appStatusBadge [tone]="tone">Loading</span>
    <mat-card [class.active]="active"></mat-card>
  `);
  assert.deepEqual(elements[0].bindings.map(binding => binding.kind), ['Class', 'Style', 'Attribute']);
  assert.deepEqual(elements[0].bindings.map(binding => binding.name), ['stock-ok', 'color', 'data-tone']);
  const inventory = uiInventory([{ name: 'Host', storyOnly: false, templateFile: 'host.html', elements }]);
  assert.equal(inventory.categories['status-or-utility-composition'], 2);
  assert.equal(inventory.categories['bound-visual-composition'], 2);
  assert.equal(inventory.categories['shared-status-badge'], 1);
  assert(!inventory.elements.find(element => element.tag === 'mat-card').categories.includes('bound-visual-composition'));
});

test('migrated day-entry statuses cannot bypass the shared badge', () => {
  const [legacy] = templateElements('<span class="input-day-status input-day-status--danger">Low stock</span>');
  assert.throws(() => assertSharedPrimitives(legacy), /status badge/);
  const [shared] = templateElements('<span appStatusBadge tone="danger" size="small" emphasis="medium">Low stock</span>');
  assertSharedPrimitives(shared);
  const inventory = uiInventory([{ name: 'Host', storyOnly: false, templateFile: 'host.html', elements: [shared] }]);
  assert.equal(inventory.categories['shared-status-badge'], 1);
  assert.equal(inventory.categories['status-or-utility-composition'], undefined);
});

test('business status and count classes cannot restore locally styled badge implementations', () => {
  for (const css of ['template-master__count-badge', 'template-master__card-status', 'inventory-list-card__status', 'meal-prep-list-card__status', 'shopping-list-list-card__status', 'status-chip']) {
    const [raw] = templateElements(`<span class="${css}">Status</span>`);
    assert.throws(() => assertSharedPrimitives(raw), /migrated business status/);
    const [shared] = templateElements(`<span appStatusBadge class="${css}" size="card" appearance="soft">Status</span>`);
    assertSharedPrimitives(shared);
    const inventory = uiInventory([{ name: 'Host', storyOnly: false, templateFile: 'host.html', elements: [shared] }]);
    assert.equal(inventory.categories['shared-status-badge'], 1);
    assert.equal(inventory.categories['status-or-utility-composition'], undefined);
  }
});

test('tracks descendant summary-counter styles across branches without treating projected copy as another pill', () => {
  const elements = templateElements(`<div class="inventory-summary">
    @if (ready) { <div><span>3 products</span></div> } @else { <span appSummaryPill>0 products</span> }
    <span appSummaryPill><span><strong>12</strong> products available</span></span>
  </div><span class="meal-prep-badge">4 possible</span><span>Ordinary copy</span>`);
  const inventory = uiInventory([{ name: 'Host', storyOnly: false, templateFile: 'host.html', elements }]);
  assert.equal(inventory.categories['shared-summary-pill'], 2);
  assert.equal(inventory.categories['summary-pill-composition'], 1);
  for (const element of elements) {
    if (element.text === '3 products' || element.text === '4 possible') assert.throws(() => assertSharedPrimitives(element), /summary count/);
    else assertSharedPrimitives(element);
  }
  const copy = elements.find(element => element.tag === 'span' && element.text.includes('products available'));
  assert.equal(copy.insideSummaryPill, true);
  assert.equal(copy.summaryContainer, 'inventory-summary');
});

test('calendar and cycle labels retain hooks without being counted as uncovered compositions', () => {
  for (const [attribute, category, classes, message] of [
    ['appCalendarTag', 'shared-calendar-tag', ['calendar-year-card__status', 'calendar-year-chip', 'calendar-month-day__today-pill', 'calendar-week-grid__today-pill', 'calendar-week-mobile__today-pill', 'calendar-week-chip', 'calendar-week-meta-pill', 'calendar-month-day__alert-badge', 'calendar-day-summary__assignment-badge', 'calendar-day-summary__source-pill'], /calendar label/],
    ['appBreakdownBadge', 'shared-breakdown-badge', ['lc-meta-chip', 'lc-overview-badge', 'lc-status-badge'], /cycle label/],
  ]) {
    for (const css of classes) {
      const [raw] = templateElements(`<span class="${css}">Details</span>`);
      assert.throws(() => assertSharedPrimitives(raw), message);
      const [shared] = templateElements(`<span ${attribute} class="${css}">Details</span>`);
      assertSharedPrimitives(shared);
      const inventory = uiInventory([{ name: 'Host', storyOnly: false, templateFile: 'host.html', elements: [shared] }]);
      assert.equal(inventory.categories[category], 1);
      for (const uncovered of ['badge-composition', 'status-or-utility-composition', 'notice-composition']) assert.equal(inventory.categories[uncovered], undefined);
    }
  }
  // Metrics use a different component; internal rich-count parts are not label roots.
  for (const element of templateElements('<div appOverviewMetric class="calendar-week-overview__pill" [value]="12" label="Months"></div><span class="calendar-year-chip__value">3</span>')) assertSharedPrimitives(element);
});

test('overview metrics, date summaries and emphasis markers cannot restore raw badge compositions', () => {
  for (const [tag, attribute, css, category] of [
    ['div', 'appOverviewMetric', 'calendar-week-overview__pill', 'shared-overview-metric'],
    ['div', 'appDateBadge', 'planning-actions-modal__date-pill', 'shared-date-badge'],
    ['em', 'appStatusBadge', 'home-day-entry__badge', 'shared-status-badge'],
  ]) {
    const [raw] = templateElements(`<${tag} class="${css}">Summary</${tag}>`);
    assert.throws(() => assertSharedPrimitives(raw));
    const [shared] = templateElements(`<${tag} ${attribute} class="${css}">Summary</${tag}>`);
    assertSharedPrimitives(shared);
    const inventory = uiInventory([{ name: 'Host', storyOnly: false, templateFile: 'host.html', elements: [shared] }]);
    assert.equal(inventory.categories[category], 1);
    assert.equal(inventory.categories['badge-composition'], undefined);
  }
});
