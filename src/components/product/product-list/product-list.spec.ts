import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductList } from './product-list';

describe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductList);
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

  it('should hide add button in single-edit mode', () => {
    fixture.componentRef.setInput('mode', 'single-edit');
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector('.add-btn');

    expect(addButton).toBeNull();
  });

  it('should emit selected in single-edit mode', () => {
    const emitted: unknown[] = [];
    component.selected.subscribe((item) => emitted.push(item));

    fixture.componentRef.setInput('mode', 'single-edit');
    fixture.detectChanges();

    component.onRowClick(component.resolvedProducts[0]);

    expect(emitted.length).toBe(1);
  });

  it('should emit selectedMany in multi-edit mode', () => {
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'multi-edit');
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedProducts[0], true);
    component.onCheckboxChange(component.resolvedProducts[1], true);

    expect((emitted[emitted.length - 1] as unknown[]).length).toBe(2);
  });

  it('should toggle selection on the first checkbox click in multi-edit mode', () => {
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'multi-edit');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted[emitted.length - 1] as unknown[]).length).toBe(1);
    expect(component.isSelected(component.resolvedProducts[0].id)).toBeTrue();
  });

  it('should show available quantity column when requested', () => {
    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.componentRef.setInput('showAvailableQty', true);
    fixture.componentRef.setInput('products', [
      {
        id: '10',
        name: 'Riz',
        quantityPerUnit: 500,
        quantityUnit: 'g',
        availableQuantity: 1200,
        availableQuantityUnit: 'g',
      },
    ]);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const headerCells = Array.from(
      nativeElement.querySelectorAll('th'),
    ).map((cell) => (cell as HTMLElement).textContent?.trim() ?? '');

    expect(headerCells).toContain('Disponible');
    expect(nativeElement.textContent).toContain('1200 g');
  });

  it('should hide the local chrome when embedded', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('mat-card')).toBeNull();
    expect(nativeElement.querySelector('.add-btn')).toBeNull();
    expect(nativeElement.querySelector('[data-testid="product-list-embedded"]')).not.toBeNull();
    expect(nativeElement.querySelector('table')).not.toBeNull();
  });

  it('should render the embedded empty state without an extra card', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.componentRef.setInput('products', []);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('mat-card')).toBeNull();
    expect(nativeElement.textContent).toContain('Aucun produit disponible.');
  });
});
