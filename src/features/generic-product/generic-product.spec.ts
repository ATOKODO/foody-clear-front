import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericProduct } from './generic-product';

describe('GenericProduct', () => {
  let component: GenericProduct;
  let fixture: ComponentFixture<GenericProduct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericProduct]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericProduct);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
