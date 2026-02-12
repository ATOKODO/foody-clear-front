import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PlanningFeature } from './planning.feature';
import { CycleService } from '../../services/cycle-service';
import { CycleAssignementService } from '../../services/cycle-assignement-service';

describe('PlanningFeature', () => {
  let component: PlanningFeature;
  let fixture: ComponentFixture<PlanningFeature>;
  const cycleServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  const cycleAssignmentServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findInRange: jasmine.createSpy('findInRange').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of(null)),
    update: jasmine.createSpy('update').and.returnValue(of(null)),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanningFeature],
      providers: [
        { provide: CycleService, useValue: cycleServiceMock },
        { provide: CycleAssignementService, useValue: cycleAssignmentServiceMock },
      ],
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
