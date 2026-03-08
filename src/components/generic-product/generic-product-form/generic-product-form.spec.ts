import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericProductForm } from './generic-product-form';

describe('GenericProductForm', () => {
  let component: GenericProductForm;
  let fixture: ComponentFixture<GenericProductForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericProductForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
