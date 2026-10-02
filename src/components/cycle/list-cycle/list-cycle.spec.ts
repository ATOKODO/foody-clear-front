import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CycleBreakdownMetric,
  CycleDaySetBreakdown,
  CycleListItem,
  CycleSlotBreakdown,
  ListCycle,
} from './list-cycle';

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
    expect(fixture.nativeElement.querySelector('.add-btn')).not.toBeNull();
  });

  it('should hide add button in select-single mode', () => {
    fixture.componentRef.setInput('mode', 'select-single');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.add-btn')).toBeNull();
  });

  it('should hide the list header chrome in embedded manage mode', () => {
    fixture.componentRef.setInput('cycles', [createCycle()]);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.lc-shell__header')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.lc-card__footer'),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('KCAL');
    expect(fixture.nativeElement.textContent).toContain('Below target');
    expect(fixture.nativeElement.textContent).toContain('55.56%');
    expect(fixture.nativeElement.textContent).toContain('Edit');
    expect(fixture.nativeElement.textContent).toContain('Remove');
  });

  it('should render a plain empty state in embedded manage mode', () => {
    fixture.componentRef.setInput('cycles', []);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'No cycle available.',
    );
  });

  it('should emit addRequested when plus button is clicked', () => {
    const emitted: unknown[] = [];
    component.addRequested.subscribe((value) => emitted.push(value));

    component.onAddCycle();

    expect(emitted.length).toBe(1);
  });

  it('should emit editRequested with clicked cycle', () => {
    const emitted: unknown[] = [];
    const cycle = createCycle();
    component.editRequested.subscribe((value) => emitted.push(value));

    component.onEdit(cycle);

    expect(emitted).toEqual([cycle]);
  });

  it('should emit deleteRequested with clicked cycle', () => {
    const emitted: unknown[] = [];
    const cycle = createCycle({ id: 2, title: 'Masse' });
    component.deleteRequested.subscribe((value) => emitted.push(value));

    component.onDelete(cycle);

    expect(emitted).toEqual([cycle]);
  });

  it('should emit selected in single select mode', () => {
    const emitted: unknown[] = [];
    const cycles = [createCycle(), createCycle({ id: 2, title: 'Masse' })];
    component.selected.subscribe((value) => emitted.push(value));

    fixture.componentRef.setInput('cycles', cycles);
    fixture.componentRef.setInput('mode', 'select-single');
    fixture.detectChanges();

    component.onRowClick(cycles[1]);

    expect(emitted).toEqual([cycles[1]]);
  });

  it('should emit selectedMany in multi select mode', () => {
    const emitted: unknown[] = [];
    const cycles = [createCycle(), createCycle({ id: 2, title: 'Masse' })];
    component.selectedMany.subscribe((value) => emitted.push(value));

    fixture.componentRef.setInput('cycles', cycles);
    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    component.onCheckboxChange(cycles[0], true);
    component.onCheckboxChange(cycles[1], true);

    expect(emitted.at(-1)).toEqual(cycles);
  });

  it('should toggle selection on the first checkbox click in multi select mode', () => {
    const emitted: unknown[] = [];
    const cycles = [createCycle()];
    component.selectedMany.subscribe((value) => emitted.push(value));

    fixture.componentRef.setInput('cycles', cycles);
    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted.at(-1) as unknown[]).length).toBe(1);
    expect(component.isSelected(cycles[0].id)).toBeTrue();
    expect(checkbox.getAttribute('aria-label')).toBe('Select ' + cycles[0].title);
    expect(emitted.length).toBe(1);
    checkbox.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(2);
    expect(emitted.at(-1)).toEqual([]);
    expect(component.isSelected(cycles[0].id)).toBeFalse();
  });

  it('should render the day set summary and overflow badges', () => {
    fixture.componentRef.setInput('cycles', [
      createCycle({
        missingDayCount: 4,
        daySetMetrics: [
          createMetric({
            key: 'proteins',
            label: 'Proteines',
            value: 190,
            target: 180,
            percentage: 105.56,
            status: 'over',
          }),
          createMetric({
            key: 'carbs',
            label: 'Glucides',
            value: 110,
            target: 120,
            percentage: 91.67,
            status: 'under',
          }),
          createMetric({
            key: 'lipids',
            label: 'Lipides',
            value: 55,
            target: 60,
            percentage: 91.67,
            status: 'under',
          }),
        ],
        hasDaySetOverflow: true,
        hasSlotOverflow: true,
        hasMissingSlotBreakdown: true,
      }),
    ]);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain(
      'Effective daily average / cycle target',
    );
    expect(textContent).toContain(
      '4 day(s) without a day set use the cycle target directly.',
    );
    expect(textContent).toContain('Day sets > cycle');
    expect(textContent).toContain('Slots > day set');
    expect(textContent).toContain('Partial slot breakdown');
  });

  it('should expand and collapse the detail panel', () => {
    fixture.componentRef.setInput('cycles', [createCycle()]);
    fixture.detectChanges();

    const toggleButton = fixture.nativeElement.querySelector('.lc-toggle-btn');

    toggleButton.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.lc-detail-panel'),
    ).not.toBeNull();

    toggleButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-detail-panel')).toBeNull();
  });

  it('should render day sets and slots with their ratios when expanded', () => {
    fixture.componentRef.setInput('cycles', [createCycle()]);
    fixture.detectChanges();

    const toggleButton = fixture.nativeElement.querySelector('.lc-toggle-btn');
    toggleButton.click();
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('Training');
    expect(textContent).toContain('Petit dejeuner');
    expect(textContent).toContain('08:00 - 09:00');
    expect(textContent).toContain('50%');
    expect(textContent).toContain('KCAL');
    expect(textContent).toContain('1070 / 1740 kcal');
    expect(textContent).toContain('1070 / 1070 kcal');
    expect(textContent).toContain('On target');
  });

  it('should show an unavailable slot breakdown state when slots cannot be reconstructed', () => {
    fixture.componentRef.setInput('cycles', [
      createCycle({
        daySets: [
          createDaySet({
            slots: [],
            slotMetrics: [],
            hasMissingSlotBreakdown: true,
          }),
        ],
        hasMissingSlotBreakdown: true,
      }),
    ]);
    fixture.detectChanges();

    const toggleButton = fixture.nativeElement.querySelector('.lc-toggle-btn');
    toggleButton.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.lc-slot-missing'),
    ).not.toBeNull();
  });

  it('should cover cycle labels, keyboard guards, selection toggles, and status branches', () => {
    const cycles = [createCycle(), createCycle({ id: 2, title: 'Repos' })];
    const selected: unknown[] = [];
    const selectedMany: unknown[] = [];
    component.selected.subscribe((value) => selected.push(value));
    component.selectedMany.subscribe((value) => selectedMany.push(value));

    fixture.componentRef.setInput('cycles', cycles);
    fixture.componentRef.setInput('activeCycleId', 2);
    fixture.componentRef.setInput('selectedIds', [1, 2]);
    fixture.detectChanges();
    expect(component.trackById(0, cycles[0])).toBe(1);
    expect(component.trackByMetric(0, cycles[0].daySetMetrics[0])).toBe('kcal');
    expect(component.trackByDaySetId(0, cycles[0].daySets[0])).toBe(1);
    expect(component.trackBySlotId(0, cycles[0].daySets[0].slots[0])).toContain('breakfast');
    expect(component.trackByEmbeddedCard(0, component.getEmbeddedSummaryCards(cycles[0])[0])).toBe('kcal');
    expect(component.isRowActive(cycles[1], 1)).toBeTrue();
    expect(component.hasSlotMetrics(cycles[0].daySets[0])).toBeTrue();
    expect(component.hasSlotMetrics({ ...cycles[0].daySets[0], slotMetrics: [] })).toBeFalse();
    expect(component.formatAmount(2)).toBe('2');
    expect(component.formatAmount(2.5)).toBe('2.5');
    expect(component.formatAmount(2.05)).toBe('2.05');
    expect(component.formatPercent(null)).toBe('Target 0');
    expect(component.formatPercent(25.5)).toBe('25.5%');
    expect(component.formatDuration(1, 'mois')).toBe('1 month');
    expect(component.formatDuration(2, 'mois')).toBe('2 months');
    expect(component.formatDuration(1, 'semaine')).toBe('1 week');
    expect(component.formatDuration(2, 'jour')).toBe('2 days');
    expect(component.getStatusLabel('over')).toBe('Over');
    expect(component.getStatusLabel('exact')).toBe('On target');
    expect(component.getStatusLabel('missing')).toBe('Unavailable');
    expect(component.getStatusLabel('under')).toBe('Below target');
    expect(component.getStatusClass('over')).toBe('lc-status-over');

    component.onRowClick(cycles[0]);
    component.onRowKeydown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      cycles[0],
    );
    component.onCheckboxChange(cycles[0], true);
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.onCheckboxClick(event);
    component.onToggleExpanded(event, 1);
    component.onToggleExpanded(event, 1);
    component.stopPropagation(event);
    expect(event.stopPropagation).toHaveBeenCalled();

    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', [1, 2]);
    fixture.detectChanges();
    expect(component.isSelected(1)).toBeTrue();
    const enter = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(enter, 'preventDefault');
    component.onRowKeydown(enter, cycles[1]);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(selected).toEqual([cycles[1]]);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();
    component.onCheckboxChange(cycles[0], true);
    component.onCheckboxChange(cycles[0], false);
    expect(selectedMany.length).toBe(2);

    component.onEdit(cycles[0]);
    component.onDelete(cycles[0]);
    component.onAddCycle();
    fixture.componentRef.setInput('mode', 'manage');
    fixture.detectChanges();
    component.onAddCycle();
    expect(component.getToggleLabel(1)).toBe('View details');
  });

  it('should resolve embedded summary comparison states at zero and above target', () => {
    const cycle = createCycle({
      energyKcal: 10,
      proteins: 100,
      carbs: 0,
      lipids: 0,
      daySetTotals: { energyKcal: 0, proteins: 120, carbs: 0, lipids: 0 },
    });
    const cards = component.getEmbeddedSummaryCards(cycle);
    expect(cards[0].percentage).toBe(0);
    expect(cards[0].status).toBe('under');
    expect(cards[2].percentage).toBeNull();
    expect(cards[2].status).toBe('exact');
    expect(cards[1].status).toBe('over');
  });

});

function createMetric(
  overrides: Partial<CycleBreakdownMetric> = {},
): CycleBreakdownMetric {
  return {
    key: 'proteins',
    label: 'Proteines',
    unit: 'g',
    value: 50,
    target: 100,
    percentage: 50,
    status: 'under',
    ...overrides,
  };
}

function createSlot(
  overrides: Partial<CycleSlotBreakdown> = {},
): CycleSlotBreakdown {
  return {
    id: 11,
    title: 'Petit dejeuner',
    key: 'breakfast',
    timeRange: '08:00 - 09:00',
    totals: { energyKcal: 390, proteins: 50, carbs: 25, lipids: 10 },
    metrics: [
      createMetric({ key: 'kcal', label: 'KCAL', unit: 'kcal', value: 390, target: 1070, percentage: 36.45, status: 'under' }),
      createMetric({ key: 'proteins', label: 'Proteines', value: 50, target: 100, percentage: 50, status: 'under' }),
      createMetric({ key: 'carbs', label: 'Glucides', value: 25, target: 100, percentage: 25, status: 'under' }),
      createMetric({ key: 'lipids', label: 'Lipides', value: 10, target: 30, percentage: 33.33, status: 'under' }),
    ],
    ...overrides,
  };
}

function createDaySet(
  overrides: Partial<CycleDaySetBreakdown> = {},
): CycleDaySetBreakdown {
  return {
    id: 1,
    title: 'Training',
    totals: { energyKcal: 1070, proteins: 100, carbs: 100, lipids: 30 },
    metrics: [
      createMetric({ key: 'kcal', label: 'KCAL', unit: 'kcal', value: 1070, target: 1740, percentage: 61.49, status: 'under' }),
      createMetric({ key: 'proteins', label: 'Proteines', value: 100, target: 180, percentage: 55.56, status: 'under' }),
      createMetric({ key: 'carbs', label: 'Glucides', value: 100, target: 120, percentage: 83.33, status: 'under' }),
      createMetric({ key: 'lipids', label: 'Lipides', value: 30, target: 60, percentage: 50, status: 'under' }),
    ],
    slotTotals: { energyKcal: 1070, proteins: 100, carbs: 100, lipids: 30 },
    slotMetrics: [
      createMetric({ key: 'kcal', label: 'KCAL', unit: 'kcal', value: 1070, target: 1070, percentage: 100, status: 'exact' }),
      createMetric({ key: 'proteins', label: 'Proteines', value: 100, target: 100, percentage: 100, status: 'exact' }),
      createMetric({ key: 'carbs', label: 'Glucides', value: 100, target: 100, percentage: 100, status: 'exact' }),
      createMetric({ key: 'lipids', label: 'Lipides', value: 30, target: 30, percentage: 100, status: 'exact' }),
    ],
    slots: [createSlot()],
    hasSlotOverflow: false,
    hasMissingSlotBreakdown: false,
    ...overrides,
  };
}

function createCycle(overrides: Partial<CycleListItem> = {}): CycleListItem {
  return {
    id: 1,
    title: 'Seche',
    color: '#22c55e',
    energyKcal: 1740,
    proteins: 180,
    carbs: 120,
    lipids: 60,
    durationDays: 28,
    durationCount: 4,
    durationType: 'semaine',
    missingDayCount: 0,
    daySetTotals: { energyKcal: 1070, proteins: 100, carbs: 100, lipids: 30 },
    daySetMetrics: [
      createMetric({ key: 'kcal', label: 'KCAL', unit: 'kcal', value: 1070, target: 1740, percentage: 61.49, status: 'under' }),
      createMetric({ key: 'proteins', label: 'Proteines', value: 100, target: 180, percentage: 55.56, status: 'under' }),
      createMetric({ key: 'carbs', label: 'Glucides', value: 100, target: 120, percentage: 83.33, status: 'under' }),
      createMetric({ key: 'lipids', label: 'Lipides', value: 30, target: 60, percentage: 50, status: 'under' }),
    ],
    daySets: [createDaySet()],
    hasDaySetOverflow: false,
    hasSlotOverflow: false,
    hasMissingSlotBreakdown: false,
    ...overrides,
  };
}
