import { TestBed } from '@angular/core/testing';

import { NutritionValueService } from './nutrition-value-service';

describe('NutritionValueService', () => {
  let service: NutritionValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NutritionValueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
