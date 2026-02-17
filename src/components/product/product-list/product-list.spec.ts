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
    const emitted: Array<unknown> = [];
    component.selected.subscribe((item) => emitted.push(item));

    fixture.componentRef.setInput('mode', 'single-edit');
    fixture.detectChanges();

    component.onRowClick(component.resolvedProducts[0]);

    expect(emitted.length).toBe(1);
  });

  it('should emit selectedMany in multi-edit mode', () => {
    const emitted: Array<unknown> = [];
    component.selectedMany.subscribe((items) => emitted.push(items));

    fixture.componentRef.setInput('mode', 'multi-edit');
    fixture.detectChanges();

    component.onCheckboxChange(component.resolvedProducts[0], true);
    component.onCheckboxChange(component.resolvedProducts[1], true);

    expect((emitted[emitted.length - 1] as unknown[]).length).toBe(2);
  });
});
