import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutritionValue } from './nutrition-value';

describe('NutritionValue', () => {
  let component: NutritionValue;
  let fixture: ComponentFixture<NutritionValue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionValue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritionValue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
