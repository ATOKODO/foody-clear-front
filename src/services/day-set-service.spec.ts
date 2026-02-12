import { TestBed } from '@angular/core/testing';

import { DaySetService } from './day-set-service';

describe('DaySetService', () => {
  let service: DaySetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DaySetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
