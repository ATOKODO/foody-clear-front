import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { InputDayService } from './input-day-service';

describe('InputDayService', () => {
  let service: InputDayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InputDayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
