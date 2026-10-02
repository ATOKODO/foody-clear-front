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
    expect(fixture.nativeElement.textContent).toContain('No day set available.');
  });

  it('should emit selected in single select mode', () => {
    const emitted: unknown[] = [];
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
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedDaySets[0], true);
    component.onCheckboxChange(component.resolvedDaySets[2], true);

    expect(emitted.at(-1)).toEqual([
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
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted.at(-1) as unknown[]).length).toBe(1);
    expect(component.isSelected(component.resolvedDaySets[0].id)).toBeTrue();
    expect(checkbox.getAttribute('aria-label')).toBe('Select ' + component.resolvedDaySets[0].title);
    expect(emitted.length).toBe(1);
    checkbox.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(2);
    expect(emitted.at(-1)).toEqual([]);
    expect(component.isSelected(component.resolvedDaySets[0].id)).toBeFalse();
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

  it('should cover list guards, macro values, and manage actions', () => {
    const daySets = [
      { id: '10', title: 'Work', protein: 12, carbs: 30, fat: 4 },
      { id: '11', title: 'Rest', protein: 8, carbs: 20, fat: 3 },
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

    fixture.componentRef.setInput('daySets', daySets);
    fixture.detectChanges();
    expect(component.trackById(0, daySets[0])).toBe('10');
    expect(component.getProtein(daySets[0])).toBe(12);
    expect(component.getCarbs(daySets[0])).toBe(30);
    expect(component.getFat(daySets[0])).toBe(4);
    expect(component.isSelectionDisabled(daySets[0])).toBeFalse();

    component.onRowClick(daySets[0]);
    component.onRowKeydown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      daySets[0],
    );
    component.onCheckboxChange(daySets[0], true);

    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', ['11', '10']);
    fixture.detectChanges();
    expect(component.isSelected('10')).toBeTrue();
    expect(component.isSelected('11')).toBeFalse();
    const enter = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(enter, 'preventDefault');
    component.onRowKeydown(enter, daySets[1]);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(selected).toEqual([daySets[1]]);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.componentRef.setInput('maxSelections', 1.9);
    fixture.detectChanges();
    component.onCheckboxChange(daySets[0], true);
    component.onCheckboxChange(daySets[1], true);
    component.onCheckboxChange(daySets[0], false);
    const click = new MouseEvent('click');
    spyOn(click, 'stopPropagation');
    component.onCheckboxClick(click);
    expect(click.stopPropagation).toHaveBeenCalled();
    expect(selectedMany.length).toBe(3);

    fixture.componentRef.setInput('mode', 'manage');
    fixture.detectChanges();
    component.onAddClick();
    component.onEditClick(daySets[0]);
    component.onDeleteClick(daySets[0]);
    expect(added).toHaveSize(1);
    expect(edited).toEqual([daySets[0]]);
    expect(deleted).toEqual([daySets[0]]);
  });
});
