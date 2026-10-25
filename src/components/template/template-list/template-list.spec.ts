import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { TemplateList } from './template-list';
import { Template, TemplateItem } from '../../../interfaces/template.interface';

describe('TemplateList', () => {
  let component: TemplateList;
  let fixture: ComponentFixture<TemplateList>;

  const templates = [
    {
      id: 1,
      title: 'Jour training',
      items: [],
      totalsMacros: null,
    },
    {
      id: 2,
      title: 'Jour repos',
      items: [{ id: 21 }],
      totalsMacros: {
        targetSource: 'daySet',
        dayTotal: {},
        targets: {},
        deltaToTargets: {},
        bySlot: [],
      },
      comparisonDaySet: {
        id: 8,
        title: 'DS training',
        nutritionValue: null,
        slots: [],
      },
    },
  ] as unknown as Template[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateList],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the selected template id when clicking a row', () => {
    const emitted: number[] = [];
    component.templateSelected.subscribe((id) => emitted.push(id));
    fixture.componentRef.setInput('templates', templates);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('[data-testid="template-select-2"] .app-selectable-card__control') as HTMLElement;
    row.click();

    expect(emitted).toEqual([2]);
  });

  it('should emit edit and delete ids from the row actions', () => {
    const edited: number[] = [];
    const deleted: number[] = [];
    component.editRequested.subscribe((id) => edited.push(id));
    component.deleteRequested.subscribe((id) => deleted.push(id));
    fixture.componentRef.setInput('templates', templates);
    fixture.componentRef.setInput('selectedTemplateId', 1);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    (nativeElement.querySelector('[data-testid="template-edit"]') as HTMLButtonElement).click();
    (nativeElement.querySelector('[data-testid="template-delete-1"]') as HTMLButtonElement).click();

    expect(edited).toEqual([1]);
    expect(deleted).toEqual([1]);
  });

  it('should mark the selected row with the active class', () => {
    fixture.componentRef.setInput('templates', templates);
    fixture.componentRef.setInput('selectedTemplateId', 2);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('[data-testid="template-select-2"]') as HTMLElement;

    expect(row.classList.contains('app-selectable-card--active')).toBeTrue();
  });

  it('should render the comparison selector inside the nutrition card', () => {
    fixture.componentRef.setInput('templates', templates);
    fixture.componentRef.setInput('selectedTemplateId', 2);
    fixture.componentRef.setInput('selectedTemplate', templates[1]);
    fixture.componentRef.setInput('daySets', [{ id: 8, title: 'DS training' }]);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('.template-compare-card__field')).not.toBeNull();
    expect(nativeElement.textContent).toContain('Nutrition comparison');
  });
});

describe('TemplateList shared stock badges', () => {
  it('distinguishes available, insufficient and unavailable stock without an implicit alert', async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateList], providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(TemplateList);
    for (const [enoughStock, label, tone, appearance] of [
      [true, 'Stock OK', 'success', 'soft'],
      [false, 'Low stock', 'danger', 'soft'],
      [undefined, 'Unknown stock', 'neutral', 'bare'],
      [null, 'Unknown stock', 'neutral', 'bare'],
    ] as const) {
      const item = {
        id: 21, productId: 1, productName: 'Demo product', qty: 1, qtyUnit: 'piece',
        slotId: null, slotKey: null, stockByInventory: [],
        stockAvailability: enoughStock === undefined ? undefined : {
          enoughStock, totalAvailableNormalized: 10, requestedQtyNormalized: 1,
        },
      } as unknown as TemplateItem;
      fixture.componentRef.setInput('selectedTemplate', { id: 2, title: 'Demo template', items: [item] });
      await fixture.whenStable();
      const row: HTMLElement = fixture.nativeElement.querySelector('[data-testid="template-item-row-21"]');
      const badge = row.querySelector('span.app-status-pill')!;
      expect(badge.textContent?.trim()).toBe(label);
      expect(badge.classList.contains(`app-status-pill--${tone}`)).toBeTrue();
      expect(badge.classList.contains(`app-status-pill--appearance-${appearance}`)).toBeTrue();
      expect(badge.getAttribute('role')).toBeNull();
    }
  });
});
