import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductList } from './product-list';
import type { ProductListItem } from './product-list-item.model';

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

    expect((emitted.at(-1) as unknown[]).length).toBe(2);
  });

  it('should toggle selection on the first checkbox click in multi-edit mode', () => {
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'multi-edit');
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    checkbox.click();
    fixture.detectChanges();

    expect((emitted.at(-1) as unknown[]).length).toBe(1);
    expect(component.isSelected(component.resolvedProducts[0].id)).toBeTrue();
  });

  it('should filter products from the shared search field', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.componentRef.setInput('products', [
      {
        id: '10',
        name: 'Riz',
        barcode: '123',
        category: 'Epicerie',
        genericProduct: 'Riz blanc',
        tagNames: ['Sec'],
      },
      {
        id: '11',
        name: 'Pomme',
        barcode: '456',
        category: 'Fruits',
        genericProduct: 'Pomme verte',
        tagNames: ['Bio'],
      },
    ]);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const searchInput = nativeElement.querySelector('[data-testid="product-list-search"]') as HTMLInputElement;

    searchInput.value = 'riz';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-testid="product-row-10"]')).not.toBeNull();
    expect(nativeElement.querySelector('[data-testid="product-row-11"]')).toBeNull();
  });

  it('should show an empty-state message when search has no match', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.componentRef.setInput('products', [{ id: '10', name: 'Riz' }]);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const searchInput = nativeElement.querySelector('[data-testid="product-list-search"]') as HTMLInputElement;

    searchInput.value = 'banane';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(nativeElement.textContent).toContain('No product matches the search.');
  });

  it('should render category and generic product columns in manage mode', () => {
    fixture.componentRef.setInput('products', [
      {
        id: '10',
        name: 'Riz',
        barcode: '123',
        quantityPerUnit: 500,
        quantityUnit: 'g',
        price: 2.5,
        priceUnit: 'kg',
        tagNames: ['Sec'],
        nutritionValuesCount: 4,
        category: 'Epicerie',
        genericProduct: 'Riz blanc',
      },
    ]);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const headerCells = Array.from(nativeElement.querySelectorAll('th')).map(
      (cell) => (cell as HTMLElement).textContent?.trim() ?? '',
    );

    expect(headerCells).toContain('Category');
    expect(headerCells).toContain('Generic product');
    expect(nativeElement.textContent).toContain('Epicerie');
    expect(nativeElement.textContent).toContain('Riz blanc');
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

    expect(headerCells).toContain('Available');
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
    expect(nativeElement.textContent).toContain('No product available.');
  });

  it('should cover product formatting, event guards, and search normalization', () => {
    const products: ProductListItem[] = [
      {
        id: '10',
        name: 'Riz complet',
        barcode: '123',
        unitType: 'Paquet',
        quantityPerUnit: 500,
        quantityUnit: 'g',
        portionCount: 2,
        portionUnit: 'tranche',
        price: 2.345,
        priceUnit: 'kg',
        tagNames: [' Bio ', ''],
        category: ' Epicerie ',
        genericProduct: 'Riz',
        availableQuantity: 1200.456,
        availableQuantityUnit: 'g',
      },
      {
        id: '11',
        name: 'Pomme',
        unitType: 'Piece',
        quantityPerUnit: undefined,
        quantityUnit: null,
        portionCount: 0,
        portionUnit: '',
        price: null,
        availableQuantity: null,
      },
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

    fixture.componentRef.setInput('products', products);
    fixture.detectChanges();
    expect(component.trackById(0, products[0])).toBe('10');
    expect(component.isRowActive(products[0], 0)).toBeTrue();
    expect(component.isRowActive(products[1], 1)).toBeFalse();
    expect(component.getUnitDisplay(products[0])).toBe('500 g (2 tranche)');
    expect(component.getUnitDisplay(products[1])).toBe('Piece');
    expect(component.getPriceDisplay(products[0])).toBe('2.35 / kg');
    expect(component.getPriceDisplay(products[1])).toBe('-');
    expect(component.getAvailableQuantityDisplay(products[0])).toBe('1200.46 g');
    expect(component.getAvailableQuantityDisplay(products[1])).toBe('-');
    expect(component.getTagNamesDisplay(products[0])).toBe('Bio');
    expect(component.getTagNamesDisplay({ id: '12', name: 'No tags' })).toBe('-');
    expect(component.getLinkedEntityDisplay('  Category  ')).toBe('Category');
    expect(component.getLinkedEntityDisplay(' ')).toBe('-');

    component.onRowClick(products[0]);
    component.onRowKeydown(
      new KeyboardEvent('keydown', { key: 'Escape' }),
      products[0],
    );

    fixture.componentRef.setInput('mode', 'select-single');
    fixture.componentRef.setInput('selectedIds', ['11', '10']);
    fixture.detectChanges();
    expect(component.isSelected('10')).toBeTrue();
    expect(component.isSelected('11')).toBeFalse();
    const enter = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(enter, 'preventDefault');
    component.onRowKeydown(enter, products[1]);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(selected).toEqual([products[1]]);

    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();
    component.onCheckboxChange(products[0], true);
    component.onCheckboxChange(products[0], false);
    const click = new MouseEvent('click');
    spyOn(click, 'stopPropagation');
    component.onCheckboxClick(click, products[1]);
    expect(click.stopPropagation).toHaveBeenCalled();
    expect(selectedMany.length).toBe(3);

    fixture.componentRef.setInput('mode', 'manage');
    fixture.detectChanges();
    component.onAddClick();
    component.onEditClick(products[0]);
    component.onDeleteClick(products[0]);
    expect(added).toHaveSize(1);
    expect(edited).toEqual([products[0]]);
    expect(deleted).toEqual([products[0]]);

    component.onSearchTermChange('  RÍZ  ');
    expect(component.resolvedProducts).toEqual([products[0]]);
    component.onSearchTermChange('missing');
    expect(component.resolvedProducts).toEqual([]);
    component.onSearchTermChange('');
    expect(component.resolvedProducts).toEqual(products);

    const insertAvailableQtyColumn = (component as any)
      .insertAvailableQtyColumn as (columns: string[]) => string[];
    expect(insertAvailableQtyColumn(['name'])).toEqual(['name', 'availableQty']);
    expect(insertAvailableQtyColumn(['unit', 'availableQty'])).toEqual([
      'unit',
      'availableQty',
    ]);
  });
});
