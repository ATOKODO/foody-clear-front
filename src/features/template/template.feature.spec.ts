import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateFeature } from './template.feature';

describe('TemplateFeature', () => {
  let component: TemplateFeature;
  let fixture: ComponentFixture<TemplateFeature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFeature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
