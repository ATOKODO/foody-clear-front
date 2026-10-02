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

  it('should hide the standalone card chrome in embedded mode', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.add-btn')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });

  it('should render a plain empty state in embedded mode', () => {
    fixture.componentRef.setInput('slots', []);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No slot available.');
  });

  it('should emit selected in single select mode', () => {
    const emitted: unknown[] = [];
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
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedSlots[0], true);
    component.onCheckboxChange(component.resolvedSlots[2], true);

    expect(emitted.at(-1)).toEqual([
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
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted.at(-1) as unknown[]).length).toBe(1);
    expect(component.isSelected(component.resolvedSlots[0].id)).toBeTrue();
    expect(checkbox.getAttribute('aria-label')).toBe('Select ' + component.resolvedSlots[0].title);
    expect(emitted.length).toBe(1);
    checkbox.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(2);
    expect(emitted.at(-1)).toEqual([]);
    expect(component.isSelected(component.resolvedSlots[0].id)).toBeFalse();
  });

  it('should cover slot formatting, keyboard guards, and manage actions', () => {
    const slots = [
      {
        id: '10',
        title: 'Morning',
        startTime: '08:00:00',
        endTime: '09:30:00',
        protein: 10,
        carbs: 20,
        fat: 5,
      },
      { id: '11', title: 'Evening', startTime: null, endTime: '21:00' },
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

    fixture.componentRef.setInput('slots', slots);
    fixture.detectChanges();
    expect(component.trackById(0, slots[0])).toBe('10');
    expect(component.getTimeRange(slots[0])).toBe('08:00 - 09:30');
    expect(component.getTimeRange(slots[1])).toBe('21:00');
    expect(component.getTimeRange({ id: '12', title: 'Night' })).toBeNull();
    expect(component.getProtein(slots[0])).toBe(10);
    expect(component.getCarbs(slots[0])).toBe(20);
    expect(component.getFat(slots[0])).toBe(5);

    component.onRowClick(slots[0]);
    component.onRowKeydown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      slots[0],
    );
    component.onCheckboxChange(slots[0], true);

    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', ['11', '10']);
    fixture.detectChanges();
    expect(component.isSelected('10')).toBeTrue();
    expect(component.isSelected('11')).toBeFalse();
    const space = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(space, 'preventDefault');
    component.onRowKeydown(space, slots[1]);
    expect(space.preventDefault).toHaveBeenCalled();
    expect(selected).toEqual([slots[1]]);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();
    component.onCheckboxChange(slots[0], true);
    component.onCheckboxChange(slots[0], false);
    const click = new MouseEvent('click');
    spyOn(click, 'stopPropagation');
    component.onCheckboxClick(click);
    expect(click.stopPropagation).toHaveBeenCalled();
    expect(selectedMany.length).toBe(2);

    fixture.componentRef.setInput('mode', 'manage');
    fixture.detectChanges();
    component.onAddClick();
    component.onEditClick(slots[0]);
    component.onDeleteClick(slots[0]);
    expect(added).toHaveSize(1);
    expect(edited).toEqual([slots[0]]);
    expect(deleted).toEqual([slots[0]]);

    fixture.componentRef.setInput('slots', []);
    fixture.detectChanges();
    expect(component.hasItems).toBeFalse();
  });
});
