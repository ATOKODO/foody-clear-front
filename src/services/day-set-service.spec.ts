import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DaySetService } from './day-set-service';

describe('DaySetService', () => {
  let service: DaySetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DaySetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
