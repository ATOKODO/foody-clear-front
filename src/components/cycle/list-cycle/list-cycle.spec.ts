import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCycle } from './list-cycle';

describe('ListCycle', () => {
  let component: ListCycle;
  let fixture: ComponentFixture<ListCycle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCycle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCycle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
