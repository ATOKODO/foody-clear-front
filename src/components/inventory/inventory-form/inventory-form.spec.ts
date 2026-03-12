import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryForm } from './inventory-form';

@Component({
  standalone: true,
  imports: [InventoryForm],
  template: `
    <app-inventory-form mode="edit">
      <button inventory-form-header-actions type="button">Ouvrir l'ajout</button>
      <section inventory-form-under-name>Gestion inline</section>
    </app-inventory-form>
  `,
})
class InventoryFormHostComponent {}

describe('InventoryForm', () => {
  let component: InventoryForm;
  let fixture: ComponentFixture<InventoryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryForm, InventoryFormHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize add mode with default values', () => {
    expect(component.form.getRawValue()).toEqual({
      name: '',
    });
  });

  it('should patch values in edit mode when inventory is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('inventory', {
      name: 'Stock principal',
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      name: 'Stock principal',
    });
  });

  it('should emit submitted payload with trimmed name', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      name: '  Frigo  ',
    });

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: {
          name: 'Frigo',
        },
      },
    ]);
  });

  it('should project header actions and inline content under the name field', () => {
    const hostFixture = TestBed.createComponent(InventoryFormHostComponent);
    hostFixture.detectChanges();

    const element = hostFixture.nativeElement as HTMLElement;
    const actionLabels = Array.from(
      element.querySelectorAll('.inventory-form__header-actions button'),
    ).map((button) => button.textContent?.trim());

    expect(actionLabels).toEqual(["Ouvrir l'ajout", 'Options']);
    expect(element.querySelector('.inventory-form__under-name')?.textContent).toContain(
      'Gestion inline',
    );
  });
});
