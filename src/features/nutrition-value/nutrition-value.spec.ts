import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { NutritionValues } from './nutrition-value';

describe('NutritionValues', () => {
  let component: NutritionValues;
  let fixture: ComponentFixture<NutritionValues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionValues],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritionValues);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
