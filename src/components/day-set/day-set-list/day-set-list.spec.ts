import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaySetList } from './day-set-list';

describe('DaySetList', () => {
  let component: DaySetList;
  let fixture: ComponentFixture<DaySetList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaySetList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaySetList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
