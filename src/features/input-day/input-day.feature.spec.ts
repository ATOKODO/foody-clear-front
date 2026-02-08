import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputDayFeature } from './input-day.feature';

describe('InputDayFeature', () => {
  let component: InputDayFeature;
  let fixture: ComponentFixture<InputDayFeature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputDayFeature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputDayFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
