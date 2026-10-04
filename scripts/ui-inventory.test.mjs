import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSharedPrimitives, componentTemplates, templateElements, uiInventory } from './ui-inventory.mjs';

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
