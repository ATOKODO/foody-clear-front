import { TestBed } from '@angular/core/testing';

import { GenericProductService } from './generic-product-service';

describe('GenericProductService', () => {
  let service: GenericProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenericProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
