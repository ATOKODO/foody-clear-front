import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CycleAssignementService } from './cycle-assignement-service';

describe('CycleAssignementService', () => {
  let service: CycleAssignementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CycleAssignementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
