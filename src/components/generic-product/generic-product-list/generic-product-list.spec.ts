import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericProductList } from './generic-product-list';

describe('GenericProductList', () => {
  let component: GenericProductList;
  let fixture: ComponentFixture<GenericProductList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericProductList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericProductList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the standalone chrome by default', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('mat-card')).not.toBeNull();
    expect(nativeElement.querySelector('.add-btn')).not.toBeNull();
  });

  it('should remove the local card chrome when embedded', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.componentRef.setInput('genericProducts', []);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('mat-card')).toBeNull();
    expect(nativeElement.querySelector('.add-btn')).toBeNull();
    expect(nativeElement.querySelector('[data-testid="generic-product-list-embedded"]')).not.toBeNull();
    expect(nativeElement.textContent).toContain('No generic product available.');
  });
});
