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
});
