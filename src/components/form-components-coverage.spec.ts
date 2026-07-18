import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryForm } from './inventory/inventory-form/inventory-form';
import { SlotForm } from './slot/slot-form/slot-form';
import { TagForm } from './tag/tag-form/tag-form';

describe('form component branches', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagForm, InventoryForm, SlotForm],
    }).compileComponents();
  });

  it('covers tag form modes, validation and events', () => {
    const fixture: ComponentFixture<TagForm> = TestBed.createComponent(TagForm);
    const component = fixture.componentInstance;
    const submitted: unknown[] = [];
    const menu: unknown[] = [];
    component.submitted.subscribe((value) => submitted.push(value));
    component.menuClicked.subscribe((value) => menu.push(value));
    fixture.detectChanges();

    expect(component.heading).toBe('Add tag');
    component.onMenuClick();
    component.onSubmit();
    expect(menu).toHaveSize(1);
    expect(submitted).toHaveSize(0);
    component.form.controls.name.setValue('  organic  ');
    component.onSubmit();
    expect(submitted).toEqual([{ mode: 'add', value: { name: 'organic' } }]);
    component.form.controls.name.setValue('   ');
    component.onSubmit();
    expect(component.form.controls.name.hasError('required')).toBeTrue();

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('tag', { name: 'Frozen' });
    fixture.detectChanges();
    expect(component.heading).toBe('Edit tag');
    expect(component.form.controls.name.value).toBe('Frozen');
  });

  it('covers inventory form modes, validation and events', () => {
    const fixture: ComponentFixture<InventoryForm> = TestBed.createComponent(InventoryForm);
    const component = fixture.componentInstance;
    const submitted: unknown[] = [];
    const menu: unknown[] = [];
    component.submitted.subscribe((value) => submitted.push(value));
    component.menuClicked.subscribe((value) => menu.push(value));
    fixture.detectChanges();

    expect(component.heading).toBe('Add inventory');
    component.onMenuClick();
    component.onSubmit();
    expect(menu).toHaveSize(1);
    component.form.controls.name.setValue('  Main stock  ');
    component.onSubmit();
    expect(submitted).toEqual([{ mode: 'add', value: { name: 'Main stock' } }]);
    component.form.controls.name.setValue('   ');
    component.onSubmit();
    expect(component.form.controls.name.hasError('required')).toBeTrue();

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('inventory', { name: 'Pantry' });
    fixture.detectChanges();
    expect(component.heading).toBe('Edit inventory');
    expect(component.form.controls.name.value).toBe('Pantry');
  });

  it('covers slot form normalization and nutrition editing branches', () => {
    const fixture: ComponentFixture<SlotForm> = TestBed.createComponent(SlotForm);
    const component = fixture.componentInstance;
    const submitted: unknown[] = [];
    const menu: unknown[] = [];
    component.submitted.subscribe((value) => submitted.push(value));
    component.menuClicked.subscribe((value) => menu.push(value));
    fixture.detectChanges();

    expect(component.heading).toBe('Add slot');
    component.onMenuClick();
    component.onSubmit();
    expect(menu).toHaveSize(1);
    expect(submitted).toHaveSize(0);
    component.form.setValue({
      key: 'breakfast',
      title: 'Breakfast',
      sortOrder: 1,
      startTime: '  ',
      endTime: '09:30:00',
    });
    component.nutritionValues = [];
    component.onSubmit();
    expect(submitted[0]).toEqual({
      mode: 'add',
      value: {
        key: 'breakfast',
        title: 'Breakfast',
        sortOrder: 1,
        startTime: null,
        endTime: '09:30:00',
        nutritionValues: [],
      },
    });

    component.addNutritionValue();
    const value = component.nutritionValues[0];
    component.onNutritionKeyChange(99);
    component.onNutritionKeyChange(0);
    expect(component.getUnitsForKey('UNKNOWN')).toEqual(['G', 'MG']);
    component.removeNutritionValue(0);
    expect(component.nutritionValues).toEqual([]);

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('slot', {
      key: 'late',
      title: 'Late slot',
      sortOrder: 2,
      startTime: '9',
      endTime: null,
      nutritionValues: [],
    });
    fixture.componentRef.setInput('nutritionKeys', [
      { key: 'PROTEIN', value: 'PROTEIN', label: 'Protein', allowedUnits: ['G', 'MG'] },
    ]);
    fixture.detectChanges();
    expect(component.heading).toBe('Edit slot');
    expect(component.form.controls.startTime.value).toBe('9');
    expect(component.form.controls.endTime.value).toBe('');
    expect(component.nutritionValues.length).toBeGreaterThan(0);
    expect(component.getUnitsForKey('PROTEIN')).toEqual(['G', 'MG']);
    const internals = component as unknown as {
      normalizeTime(value: string): string | null;
      toInputTime(value: string | null): string;
    };
    expect(internals.normalizeTime('  ')).toBeNull();
    expect(internals.normalizeTime('08:00')).toBe('08:00');
    expect(internals.toInputTime(null)).toBe('');
    expect(internals.toInputTime('123456')).toBe('12345');
    expect(value).toBeDefined();
  });
});
