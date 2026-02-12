import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningFeature } from './planning.feature';

describe('PlanningFeature', () => {
  let component: PlanningFeature;
  let fixture: ComponentFixture<PlanningFeature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanningFeature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanningFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
