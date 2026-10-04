import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { UiButton } from '../button/button';
import { UiEmptyState } from '../empty-state/empty-state';
import { UiTableCell } from '../table-cell/table-cell';
import { UiTableScroll } from '../table-scroll/table-scroll';
import { UiTable } from './table';

@Component({
  imports: [UiTable, UiTableCell, UiTableScroll, UiEmptyState, UiButton, ReactiveFormsModule, MatInputModule],
  template: `<form [formGroup]="form" (ngSubmit)="submitted = form.controls.quantity.value">
    <div appTableScroll class="owner-viewport" label="Editable stock" [outlined]="outlined()">
      <table appTable class="owner-table" [density]="density()" [layout]="layout()">
        <caption>Current stock</caption>
        <thead><tr><th appTableCell scope="col">Product</th><th appTableCell scope="col" [contentAlign]="alignment()">Quantity</th></tr></thead>
        <tbody><tr><th appTableCell scope="row">Banana</th><td appTableCell class="owner-cell" [contentAlign]="alignment()">
          <input matInput type="number" aria-label="Quantity" formControlName="quantity" />
          <button appButton type="submit">Save</button>
        </td></tr><tr><td appTableCell colspan="2"><p appEmptyState>No other products</p></td></tr></tbody>
      </table>
    </div>
  </form>
  <div appEmptyState class="owner-empty" role="status" [appearance]="appearance()" [size]="size()" [tone]="tone()">
    <strong>No inventory</strong><p>Create one to track stock.</p><button appButton (click)="created = true">Create inventory</button>
  </div>`,
})
class TestHost {
  readonly form = new FormGroup({ quantity: new FormControl(1, { nonNullable: true, validators: [Validators.min(0)] }) });
  readonly density = signal<'compact' | 'standard' | 'comfortable'>('standard');
  readonly layout = signal<'auto' | 'fixed'>('auto');
  readonly alignment = signal<'start' | 'center' | 'end'>('end');
  readonly outlined = signal(true);
  readonly appearance = signal<'text' | 'panel' | 'large'>('text');
  readonly size = signal<'small' | 'medium'>('medium');
  readonly tone = signal<'muted' | 'contextual'>('muted');
  submitted: number | null = null;
  created = false;
}

describe('Shared native tables and empty states', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('retains native table structure, header scope, spanning cells and consumer classes', async () => {
    const fixture = await setup();
    const table: HTMLTableElement = fixture.nativeElement.querySelector('table');
    expect(table.caption?.textContent).toBe('Current stock');
    expect(table.querySelectorAll('th[scope="col"]').length).toBe(2);
    expect(table.querySelector('th[scope="row"]')?.textContent).toBe('Banana');
    expect(table.querySelector('td[colspan="2"]')?.textContent).toBe('No other products');
    expect(table.rows.length).toBe(3);
    expect(table.classList.contains('owner-table')).toBeTrue();
    expect(table.querySelector('.owner-cell')?.classList.contains('app-ui-table-cell')).toBeTrue();
    expect(table.querySelector('th[scope="row"]')?.hasAttribute('tabindex')).toBeFalse();
  });

  it('updates density, layout and logical cell alignment without losing consumer classes', async () => {
    const fixture = await setup();
    const table: HTMLTableElement = fixture.nativeElement.querySelector('table');
    const cell: HTMLTableCellElement = table.querySelector('.owner-cell')!;
    expect(table.style.getPropertyValue('--app-table-cell-padding')).toBe('var(--app-space-2) var(--app-space-3)');
    expect(cell.style.textAlign).toBe('end');
    fixture.componentInstance.density.set('compact');
    fixture.componentInstance.layout.set('fixed');
    fixture.componentInstance.alignment.set('center');
    await fixture.whenStable();
    expect(table.style.getPropertyValue('--app-table-cell-padding')).toBe('var(--app-space-1) var(--app-space-2)');
    expect(table.style.tableLayout).toBe('fixed');
    expect(cell.style.textAlign).toBe('center');
    expect(cell.classList.contains('owner-cell')).toBeTrue();
  });

  it('preserves projected reactive-form validation, editing and native submission', async () => {
    const fixture = await setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = '-1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
    expect(fixture.componentInstance.form.controls.quantity.value).toBe(-1);
    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.form.valid).toBeTrue();
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.submitted).toBe(12);
  });

  it('keeps the labeled viewport focusable and the outline independently configurable', async () => {
    const fixture = await setup();
    const viewport: HTMLDivElement = fixture.nativeElement.querySelector('[appTableScroll]');
    expect(viewport.getAttribute('role')).toBe('region');
    expect(viewport.getAttribute('aria-label')).toBe('Editable stock');
    expect(viewport.classList.contains('app-ui-table-scroll--outlined')).toBeTrue();
    viewport.focus();
    expect(document.activeElement).toBe(viewport);
    fixture.componentInstance.outlined.set(false);
    await fixture.whenStable();
    expect(viewport.classList.contains('app-ui-table-scroll--outlined')).toBeFalse();
    expect(viewport.classList.contains('owner-viewport')).toBeTrue();
  });

  it('preserves empty-state copy, roles and actions as presentation variants change', async () => {
    const fixture = await setup();
    const state: HTMLDivElement = fixture.nativeElement.querySelector('.owner-empty');
    expect(state.getAttribute('role')).toBe('status');
    expect(state.querySelector('strong')?.textContent).toBe('No inventory');
    fixture.componentInstance.appearance.set('large');
    fixture.componentInstance.size.set('small');
    fixture.componentInstance.tone.set('contextual');
    await fixture.whenStable();
    for (const name of ['owner-empty', 'app-ui-empty-state--large', 'app-ui-empty-state--small', 'app-ui-empty-state--contextual']) expect(state.classList.contains(name)).toBeTrue();
    expect(state.classList.contains('app-ui-empty-state--text')).toBeFalse();
    state.querySelector('button')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.created).toBeTrue();
    expect(fixture.nativeElement.querySelector('p[appEmptyState]').hasAttribute('role')).toBeFalse();
  });
});
