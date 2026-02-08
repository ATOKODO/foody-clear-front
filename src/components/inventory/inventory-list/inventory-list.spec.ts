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

  it('should emit selected in single select mode', () => {
    const emitted: Array<unknown> = [];
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
    const emitted: Array<unknown> = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedInventories[0], true);
    component.onCheckboxChange(component.resolvedInventories[2], true);

    expect(emitted[emitted.length - 1]).toEqual([
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
});
