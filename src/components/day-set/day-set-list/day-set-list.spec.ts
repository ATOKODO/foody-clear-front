import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaySetList } from './day-set-list';

describe('DaySetList', () => {
  let component: DaySetList;
  let fixture: ComponentFixture<DaySetList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaySetList],
    }).compileComponents();

    fixture = TestBed.createComponent(DaySetList);
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

    component.onRowClick(component.resolvedDaySets[1]);

    expect(emitted).toEqual([
      {
        id: '2',
        title: 'Repos',
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

    component.onCheckboxChange(component.resolvedDaySets[0], true);
    component.onCheckboxChange(component.resolvedDaySets[2], true);

    expect(emitted[emitted.length - 1]).toEqual([
      {
        id: '1',
        title: 'Lundi',
        protein: 50,
        carbs: 120,
        fat: 30,
      },
      {
        id: '3',
        title: 'Mardi',
        protein: 50,
        carbs: 150,
        fat: 30,
      },
    ]);
  });
});
