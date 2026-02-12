import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCycle } from './list-cycle';

describe('ListCycle', () => {
  let component: ListCycle;
  let fixture: ComponentFixture<ListCycle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCycle],
    }).compileComponents();

    fixture = TestBed.createComponent(ListCycle);
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

  it('should emit addRequested when plus button is clicked', () => {
    const emitted: Array<unknown> = [];
    component.addRequested.subscribe((value) => emitted.push(value));

    component.onAddCycle();

    expect(emitted.length).toBe(1);
  });

  it('should emit editRequested with clicked cycle', () => {
    const emitted: Array<unknown> = [];
    component.editRequested.subscribe((value) => emitted.push(value));

    const cycle = {
      id: 1,
      title: 'Seche',
      color: '#22c55e',
      proteins: 180,
      carbs: 120,
      lipids: 60,
      durationCount: 4,
      durationType: 'semaine' as const,
    };
    component.onEdit(cycle);

    expect(emitted).toEqual([cycle]);
  });

  it('should emit deleteRequested with clicked cycle', () => {
    const emitted: Array<unknown> = [];
    component.deleteRequested.subscribe((value) => emitted.push(value));

    const cycle = {
      id: 2,
      title: 'Masse',
      color: '#f97316',
      proteins: 220,
      carbs: 300,
      lipids: 70,
      durationCount: 6,
      durationType: 'jour' as const,
    };
    component.onDelete(cycle);

    expect(emitted).toEqual([cycle]);
  });

  it('should emit selected in single select mode', () => {
    const emitted: Array<unknown> = [];
    component.selected.subscribe((value) => emitted.push(value));

    const cycles = [
      {
        id: 1,
        title: 'Seche',
        color: '#22c55e',
        proteins: 180,
        carbs: 120,
        lipids: 60,
        durationCount: 4,
        durationType: 'semaine' as const,
      },
      {
        id: 2,
        title: 'Masse',
        color: '#f97316',
        proteins: 220,
        carbs: 300,
        lipids: 70,
        durationCount: 6,
        durationType: 'jour' as const,
      },
    ];

    fixture.componentRef.setInput('cycles', cycles);
    fixture.componentRef.setInput('mode', 'select-single');
    fixture.detectChanges();

    component.onRowClick(cycles[1]);

    expect(emitted).toEqual([cycles[1]]);
  });

  it('should emit selectedMany in multi select mode', () => {
    const emitted: Array<unknown> = [];
    component.selectedMany.subscribe((value) => emitted.push(value));

    const cycles = [
      {
        id: 1,
        title: 'Seche',
        color: '#22c55e',
        proteins: 180,
        carbs: 120,
        lipids: 60,
        durationCount: 4,
        durationType: 'semaine' as const,
      },
      {
        id: 2,
        title: 'Masse',
        color: '#f97316',
        proteins: 220,
        carbs: 300,
        lipids: 70,
        durationCount: 6,
        durationType: 'jour' as const,
      },
    ];

    fixture.componentRef.setInput('cycles', cycles);
    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    component.onCheckboxChange(cycles[0], true);
    component.onCheckboxChange(cycles[1], true);

    expect(emitted[emitted.length - 1]).toEqual(cycles);
  });
});
