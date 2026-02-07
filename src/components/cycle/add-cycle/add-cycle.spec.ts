import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCycle } from './add-cycle';

describe('AddCycle', () => {
  let component: AddCycle;
  let fixture: ComponentFixture<AddCycle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCycle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCycle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
