import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cycle } from './cycle';

describe('Cycle', () => {
  let component: Cycle;
  let fixture: ComponentFixture<Cycle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cycle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cycle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
