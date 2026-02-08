import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CycleFeature } from './cycle.feature';

describe('CycleFeature', () => {
  let component: CycleFeature;
  let fixture: ComponentFixture<CycleFeature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CycleFeature],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CycleFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
