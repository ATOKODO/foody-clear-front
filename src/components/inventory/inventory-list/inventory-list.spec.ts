import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryList } from './inventory-list';

describe('InventoryList', () => {
  let component: InventoryList;
  let fixture: ComponentFixture<InventoryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryList],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show add button in manage mode', () => {
    const addButton = fixture.nativeElement.querySelector('.add-btn');
    expect(addButton).not.toBeNull();
  });

  it('should hide add button in select-single mode', () => {
    fixture.componentRef.setInput('mode', 'select-single');
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector('.add-btn');
    expect(addButton).toBeNull();
  });

  it('should hide local chrome in embedded mode', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="inventory-list-embedded"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.add-btn')).toBeNull();
  });

  it('should render a plain embedded empty state', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.componentRef.setInput('inventories', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.inventory-list__empty')?.textContent)
      .toContain('No inventory available.');
  });

  it('should emit selected in single select mode', () => {
    const emitted: unknown[] = [];
    component.selected.subscribe((item) => emitted.push(item));

    fixture.componentRef.setInput('mode', 'select-single');
    fixture.detectChanges();

    component.onRowClick(component.resolvedInventories[1]);

    expect(emitted).toEqual([
      {
        id: '2',
        name: 'Placard cuisine',
        productCount: 11,
      },
    ]);
  });

  it('should emit selectedMany in multi select mode', () => {
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedInventories[0], true);
    component.onCheckboxChange(component.resolvedInventories[2], true);

    expect(emitted.at(-1)).toEqual([
      {
        id: '1',
        name: 'Stock principal',
        productCount: 24,
      },
      {
        id: '3',
        name: 'Congelateur',
        productCount: 8,
      },
    ]);
  });

  it('should toggle selection on the first checkbox click in multi select mode', () => {
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted.at(-1) as unknown[]).length).toBe(1);
    expect(component.isSelected(component.resolvedInventories[0].id)).toBeTrue();
    expect(checkbox.getAttribute('aria-label')).toBe('Select ' + component.resolvedInventories[0].name);
    expect(emitted.length).toBe(1);
    checkbox.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(2);
    expect(emitted.at(-1)).toEqual([]);
    expect(component.isSelected(component.resolvedInventories[0].id)).toBeFalse();
  });

  it('should cover keyboard guards, manage events, and input selection state', () => {
    const inventories = [
      { id: '10', name: 'Pantry', productCount: 4 },
      { id: '11', name: 'Freezer', productCount: 2 },
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

    fixture.componentRef.setInput('inventories', inventories);
    fixture.detectChanges();
    expect(component.trackById(0, inventories[0])).toBe('10');
    expect(component.isRowActive(inventories[0])).toBeFalse();
    expect(component.isRowActive(inventories[1])).toBeFalse();

    component.onRowClick(inventories[0]);
    component.onRowKeydown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      inventories[0],
    );
    component.onCheckboxChange(inventories[0], true);

    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', ['11', '10']);
    fixture.detectChanges();
    expect(component.isSelected('10')).toBeTrue();
    expect(component.isSelected('11')).toBeFalse();
    const enter = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(enter, 'preventDefault');
    component.onRowKeydown(enter, inventories[1]);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(selected).toEqual([inventories[1]]);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();
    component.onCheckboxChange(inventories[0], true);
    component.onCheckboxChange(inventories[0], false);
    const click = new MouseEvent('click');
    spyOn(click, 'stopPropagation');
    component.onCheckboxClick(click);
    expect(click.stopPropagation).toHaveBeenCalled();
    expect(selectedMany.length).toBe(2);

    fixture.componentRef.setInput('mode', 'manage');
    fixture.detectChanges();
    component.onAddClick();
    component.onEditClick(inventories[0]);
    component.onDeleteClick(inventories[0]);
    expect(added).toHaveSize(1);
    expect(edited).toEqual([inventories[0]]);
    expect(deleted).toEqual([inventories[0]]);

    fixture.componentRef.setInput('inventories', []);
    fixture.detectChanges();
    expect(component.hasItems).toBeFalse();
  });
});
