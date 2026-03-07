import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotList } from './slot-list';

describe('SlotList', () => {
  let component: SlotList;
  let fixture: ComponentFixture<SlotList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotList],
    }).compileComponents();

    fixture = TestBed.createComponent(SlotList);
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

    component.onRowClick(component.resolvedSlots[1]);

    expect(emitted).toEqual([
      {
        id: '2',
        title: 'Dejeuner',
        protein: 50,
        carbs: 120,
        fat: 30,
      },
    ]);
  });

  it('should emit selectedMany in multi select mode', () => {
    const emitted: Array<unknown> = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedSlots[0], true);
    component.onCheckboxChange(component.resolvedSlots[2], true);

    expect(emitted[emitted.length - 1]).toEqual([
      {
        id: '1',
        title: 'Petit dejeuner',
        protein: 50,
        carbs: 120,
        fat: 30,
      },
      {
        id: '3',
        title: 'Diner',
        protein: 50,
        carbs: 150,
        fat: 30,
      },
    ]);
  });

  it('should toggle selection on the first checkbox click in multi select mode', () => {
    const emitted: Array<unknown> = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted[emitted.length - 1] as unknown[]).length).toBe(1);
    expect(component.isSelected(component.resolvedSlots[0].id)).toBeTrue();
  });
});
