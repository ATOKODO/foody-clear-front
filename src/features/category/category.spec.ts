import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Category } from './category';
import { CategoryService } from '../../services/category-service';

describe('Category', () => {
  let component: Category;
  let fixture: ComponentFixture<Category>;
  const categoryServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(
      of({
        id: 1,
        name: 'Fruits',
        warnBeforeDays: 3,
        recentlyExpiredDays: 1,
        minQuantity: 1,
      }),
    ),
    update: jasmine.createSpy('update').and.returnValue(
      of({
        id: 1,
        name: 'Fruits',
        warnBeforeDays: 3,
        recentlyExpiredDays: 1,
        minQuantity: 1,
      }),
    ),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Category],
      providers: [{ provide: CategoryService, useValue: categoryServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Category);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
