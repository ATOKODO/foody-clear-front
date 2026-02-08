import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaySetForm } from './day-set-form';

describe('DaySetForm', () => {
  let component: DaySetForm;
  let fixture: ComponentFixture<DaySetForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaySetForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaySetForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
