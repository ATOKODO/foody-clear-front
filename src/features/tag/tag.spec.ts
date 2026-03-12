import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Tag } from './tag';
import { TagService } from '../../services/tag-service';

describe('Tag', () => {
  let component: Tag;
  let fixture: ComponentFixture<Tag>;
  const tagServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 1, name: 'Bio' })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 1, name: 'Bio' })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tag],
      providers: [{ provide: TagService, useValue: tagServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Tag);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
