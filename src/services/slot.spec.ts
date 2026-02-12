import { TestBed } from '@angular/core/testing';

import { Slot } from './slot';

describe('Slot', () => {
  let service: Slot;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Slot);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
