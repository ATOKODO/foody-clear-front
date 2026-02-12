import { TestBed } from '@angular/core/testing';

import { CycleAssignementService } from './cycle-assignement-service';

describe('CycleAssignementService', () => {
  let service: CycleAssignementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CycleAssignementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
