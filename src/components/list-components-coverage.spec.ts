import { TestBed } from '@angular/core/testing';
import { CategoryForm } from './category/category-form/category-form';
import { CategoryList } from './category/category-list/category-list';
import { GenericProductList } from './generic-product/generic-product-list/generic-product-list';
import { TagList } from './tag/tag-list/tag-list';

describe('list and form component branches', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryForm, CategoryList, TagList, GenericProductList],
    }).compileComponents();
  });

  it('covers category form input, validation, normalization and events', () => {
    const fixture = TestBed.createComponent(CategoryForm);
    const component = fixture.componentInstance;
    const submitted: unknown[] = [];
    const menuClicks: unknown[] = [];
    component.submitted.subscribe((value) => submitted.push(value));
    component.menuClicked.subscribe((value) => menuClicks.push(value));
    fixture.detectChanges();

    expect(component.heading).toBe('Add category');
    component.onMenuClick();
    expect(menuClicks).toHaveSize(1);
    component.onSubmit();
    expect(submitted).toHaveSize(0);

    component.form.patchValue({
      name: '  Fresh  ',
      warnBeforeDays: 2,
      recentlyExpiredDays: 3,
      minQuantity: 4.5,
    });
    component.onSubmit();
    expect(submitted).toEqual([
      {
        mode: 'add',
        value: {
          name: 'Fresh',
          warnBeforeDays: 2,
          recentlyExpiredDays: 3,
          minQuantity: 4.5,
        },
      },
    ]);

    component.form.patchValue({ name: '   ' });
    component.onSubmit();
    expect(component.form.controls.name.hasError('required')).toBeTrue();

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('category', {
      name: 'Stored',
      warnBeforeDays: 5,
      recentlyExpiredDays: 6,
      minQuantity: 7,
    });
    fixture.detectChanges();
    expect(component.heading).toBe('Edit category');
    expect(component.form.getRawValue()).toEqual({
      name: 'Stored',
      warnBeforeDays: 5,
      recentlyExpiredDays: 6,
      minQuantity: 7,
    });

    const normalize = (
      component as unknown as {
        normalizeNonNegativeNumber(value: unknown): number | null;
      }
    ).normalizeNonNegativeNumber;
    expect(normalize(2)).toBe(2);
    expect(normalize(-1)).toBeNull();
    expect(normalize(Number.NaN)).toBeNull();
    expect(normalize(' 3.5 ')).toBe(3.5);
    expect(normalize('')).toBeNull();
    expect(normalize('not a number')).toBeNull();
    expect(normalize(null)).toBeNull();
  });

  it('covers category list modes, selection and manage actions', () => {
    const fixture = TestBed.createComponent(CategoryList);
    const component = fixture.componentInstance;
    const categories = [
      { id: '1', name: 'Fresh', warnBeforeDays: 2, recentlyExpiredDays: 3, minQuantity: 4 },
      { id: '2', name: 'Dry', warnBeforeDays: null, recentlyExpiredDays: null, minQuantity: null },
    ];
    const selected: unknown[] = [];
    const selectedMany: unknown[] = [];
    const added: unknown[] = [];
    const edited: unknown[] = [];
    const deleted: unknown[] = [];
    component.selected.subscribe((value) => selected.push(value));
    component.selectedMany.subscribe((value) => selectedMany.push(value));
    component.addRequested.subscribe((value) => added.push(value));
    component.editRequested.subscribe((value) => edited.push(value));
    component.deleteRequested.subscribe((value) => deleted.push(value));
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();

    expect(component.isManageMode).toBeTrue();
    expect(component.displayedColumns).toContain('actions');
    expect(component.hasItems).toBeTrue();
    expect(component.trackById(0, categories[0])).toBe('1');
    expect(component.isRowActive(categories[0], 0)).toBeTrue();
    expect(component.isRowActive(categories[1], 1)).toBeFalse();
    expect(component.getNumberDisplay(null)).toBe('-');
    expect(component.getNumberDisplay(Infinity)).toBe('-');
    expect(component.getNumberDisplay(2)).toBe('2');
    expect(component.getNumberDisplay(2.345)).toBe('2.35');
    component.onAddClick();
    component.onEditClick(categories[0]);
    component.onDeleteClick(categories[0]);
    expect(added).toHaveSize(1);
    expect(edited).toEqual([categories[0]]);
    expect(deleted).toEqual([categories[0]]);

    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', ['2', '1']);
    fixture.detectChanges();
    expect(component.isSingleSelectMode).toBeTrue();
    expect(component.displayedColumns).not.toContain('select');
    expect(component.isSelected('1')).toBeTrue();
    expect(component.isSelected('2')).toBeFalse();
    component.onRowClick(categories[0]);
    expect(selected).toEqual([categories[0]]);
    component.onRowKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), categories[1]);
    component.onRowKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), categories[1]);
    expect(selected).toEqual([categories[0], categories[1]]);
    component.onAddClick();
    component.onEditClick(categories[0]);
    component.onDeleteClick(categories[0]);
    expect(added).toHaveSize(1);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.componentRef.setInput('selectedIds', ['1']);
    fixture.detectChanges();
    expect(component.isMultiSelectMode).toBeTrue();
    expect(component.displayedColumns).toContain('select');
    component.onCheckboxChange(categories[0], true);
    component.onCheckboxChange(categories[0], false);
    expect(selectedMany.length).toBe(2);
    component.onCheckboxChange(categories[0], false);
    const clickEvent = new MouseEvent('click');
    spyOn(clickEvent, 'stopPropagation');
    component.onCheckboxClick(clickEvent);
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    component.onRowClick(categories[1]);
    expect(selected).toHaveSize(2);
  });

  it('covers tag list defaults, modes and selection actions', () => {
    const fixture = TestBed.createComponent(TagList);
    const component = fixture.componentInstance;
    const tags = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    const selected: unknown[] = [];
    const selectedMany: unknown[] = [];
    const added: unknown[] = [];
    const edited: unknown[] = [];
    const deleted: unknown[] = [];
    component.selected.subscribe((value) => selected.push(value));
    component.selectedMany.subscribe((value) => selectedMany.push(value));
    component.addRequested.subscribe((value) => added.push(value));
    component.editRequested.subscribe((value) => edited.push(value));
    component.deleteRequested.subscribe((value) => deleted.push(value));
    fixture.detectChanges();
    expect(component.hasItems).toBeTrue();
    expect(component.resolvedTags).toEqual(component.defaultTags);
    expect(component.displayedColumns).toEqual(['name', 'actions']);
    expect(component.isRowActive(component.resolvedTags[0], 0)).toBeTrue();
    expect(component.isRowActive(component.resolvedTags[1], 1)).toBeFalse();

    fixture.componentRef.setInput('tags', tags);
    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', ['a', 'b']);
    fixture.detectChanges();
    expect(component.isSingleSelectMode).toBeTrue();
    expect(component.displayedColumns).toEqual(['name']);
    component.onRowClick(tags[0]);
    component.onRowKeydown(new KeyboardEvent('keydown', { key: ' ' }), tags[1]);
    component.onRowKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), tags[0]);
    expect(selected).toEqual([tags[0], tags[1]]);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();
    expect(component.isMultiSelectMode).toBeTrue();
    component.onCheckboxChange(tags[0], true);
    component.onCheckboxChange(tags[0], false);
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.onCheckboxClick(event);
    expect(selectedMany).toHaveSize(2);
    expect(event.stopPropagation).toHaveBeenCalled();

    fixture.componentRef.setInput('mode', 'manage');
    fixture.detectChanges();
    component.onAddClick();
    component.onEditClick(tags[0]);
    component.onDeleteClick(tags[0]);
    expect(added).toHaveSize(1);
    expect(edited).toEqual([tags[0]]);
    expect(deleted).toEqual([tags[0]]);
    fixture.componentRef.setInput('tags', []);
    fixture.detectChanges();
    expect(component.hasItems).toBeFalse();
  });

  it('covers generic product list formatting and selection actions', () => {
    const fixture = TestBed.createComponent(GenericProductList);
    const component = fixture.componentInstance;
    const items = [
      { id: '1', name: 'Rice', minQuantityUnit: 1, minQuantityUnitType: null, minQuantityMetric: 500, minQuantityMetricType: 'g' as const },
      { id: '2', name: 'Pasta', minQuantityUnit: 2.345, minQuantityUnitType: 'portion' as const, minQuantityMetric: null, minQuantityMetricType: null },
    ];
    const selected: unknown[] = [];
    const selectedMany: unknown[] = [];
    const added: unknown[] = [];
    const edited: unknown[] = [];
    const deleted: unknown[] = [];
    component.selected.subscribe((value) => selected.push(value));
    component.selectedMany.subscribe((value) => selectedMany.push(value));
    component.addRequested.subscribe((value) => added.push(value));
    component.editRequested.subscribe((value) => edited.push(value));
    component.deleteRequested.subscribe((value) => deleted.push(value));
    fixture.detectChanges();
    expect(component.resolvedGenericProducts).toEqual(component.defaultGenericProducts);
    expect(component.getNumberDisplay(null)).toBe('-');
    expect(component.getNumberDisplay(2)).toBe('2');
    expect(component.getNumberDisplay(2.345)).toBe('2.35');
    expect(component.getQuantityDisplay(null, 'g')).toBe('-');
    expect(component.getQuantityDisplay(2.345, 'portion')).toBe('2.35 portion');
    expect(component.getQuantityDisplay(2.345, null)).toBe('2.35');

    fixture.componentRef.setInput('genericProducts', items);
    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', ['1', '2']);
    fixture.detectChanges();
    expect(component.displayedColumns).not.toContain('select');
    component.onRowClick(items[0]);
    component.onRowKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), items[1]);
    component.onRowKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), items[0]);
    expect(selected).toEqual([items[0], items[1]]);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();
    component.onCheckboxChange(items[0], true);
    component.onCheckboxChange(items[0], false);
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.onCheckboxClick(event);
    expect(selectedMany).toHaveSize(2);
    expect(event.stopPropagation).toHaveBeenCalled();

    fixture.componentRef.setInput('mode', 'manage');
    fixture.detectChanges();
    component.onAddClick();
    component.onEditClick(items[0]);
    component.onDeleteClick(items[0]);
    expect(added).toHaveSize(1);
    expect(edited).toEqual([items[0]]);
    expect(deleted).toEqual([items[0]]);
    fixture.componentRef.setInput('genericProducts', []);
    fixture.detectChanges();
    expect(component.hasItems).toBeFalse();
  });
});
