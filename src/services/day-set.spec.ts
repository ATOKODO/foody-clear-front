import { TestBed } from '@angular/core/testing';

import { DaySet } from './day-set';

describe('DaySet', () => {
  let service: DaySet;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DaySet);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
