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

  it('should hide the standalone card chrome in embedded mode', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.add-btn')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });

  it('should render a plain empty state in embedded mode', () => {
    fixture.componentRef.setInput('daySets', []);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Aucun day set disponible.');
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

  it('should toggle selection on the first checkbox click in multi select mode', () => {
    const emitted: Array<unknown> = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted[emitted.length - 1] as unknown[]).length).toBe(1);
    expect(component.isSelected(component.resolvedDaySets[0].id)).toBeTrue();
  });

  it('should disable unchecked rows when maxSelections is reached', () => {
    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.componentRef.setInput('maxSelections', 1);
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedDaySets[0], true);

    expect(component.isSelectionDisabled(component.resolvedDaySets[1])).toBeTrue();
    expect(component.isSelectionDisabled(component.resolvedDaySets[0])).toBeFalse();
  });

  it('should allow selecting another row again after deselection', () => {
    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.componentRef.setInput('maxSelections', 1);
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedDaySets[0], true);
    component.onCheckboxChange(component.resolvedDaySets[0], false);

    expect(component.isSelectionDisabled(component.resolvedDaySets[1])).toBeFalse();
  });
});
