import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SlotService } from './slot-service';

describe('SlotService', () => {
  let service: SlotService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SlotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
