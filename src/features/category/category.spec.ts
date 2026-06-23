import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { Category } from './category';
import { CategoryService } from '../../services/category-service';

@Component({
  standalone: true,
  imports: [Category],
  template: `
    <app-category />
    <app-category />
  `,
})
class HostCategoryTestComponent {}

describe('Category', () => {
  let component: Category;
  let fixture: ComponentFixture<Category>;
  let categoryServiceMock: jasmine.SpyObj<CategoryService>;

  const createdCategory = {
    id: 1,
    name: 'Fruits',
    warnBeforeDays: 3,
    recentlyExpiredDays: 1,
    minQuantity: 1,
  };

  beforeEach(async () => {
    categoryServiceMock = jasmine.createSpyObj<CategoryService>(
      'CategoryService',
      ['setBaseUrl', 'findAll', 'create', 'update', 'remove'],
      { baseUrl: 'http://localhost:3000' },
    );

    categoryServiceMock.findAll.and.returnValue(of([]));
    categoryServiceMock.create.and.returnValue(of(createdCategory));
    categoryServiceMock.update.and.returnValue(of(createdCategory));
    categoryServiceMock.remove.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [Category, HostCategoryTestComponent],
      providers: [{ provide: CategoryService, useValue: categoryServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Category);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should not emit dataChanged during the initial load', () => {
    const emitSpy = spyOn(component.dataChanged, 'emit');

    fixture.detectChanges();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit dataChanged after creating a category', () => {
    categoryServiceMock.findAll.and.returnValues(of([]), of([createdCategory]));
    const emitSpy = spyOn(component.dataChanged, 'emit');

    fixture.detectChanges();
    component.store.openCreateForm();
    component.store.submitForm({
      mode: 'add',
      value: {
        name: 'Fruits',
        warnBeforeDays: 3,
        recentlyExpiredDays: 1,
        minQuantity: 1,
      },
    });
    fixture.detectChanges();

    expect(categoryServiceMock.create).toHaveBeenCalledWith({
      name: 'Fruits',
      warnBeforeDays: 3,
      recentlyExpiredDays: 1,
      minQuantity: 1,
    });
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit dataChanged when a mutation fails', () => {
    const error = new Error('create failed');
    categoryServiceMock.create.and.returnValue(throwError(() => error));
    const emitSpy = spyOn(component.dataChanged, 'emit');

    fixture.detectChanges();
    component.store.openCreateForm();
    component.store.submitForm({
      mode: 'add',
      value: {
        name: 'Fruits',
        warnBeforeDays: 3,
        recentlyExpiredDays: 1,
        minQuantity: 1,
      },
    });

    expect(component.store.lastError()).toBe(error);
    expect(component.store.mutationVersion()).toBe(0);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should scope one store instance per component instance', () => {
    const hostFixture = TestBed.createComponent(HostCategoryTestComponent);
    hostFixture.detectChanges();

    const categoryComponents = hostFixture.debugElement
      .queryAll(By.directive(Category))
      .map((debugElement) => debugElement.componentInstance as Category);

    expect(categoryComponents.length).toBe(2);
    expect(categoryComponents[0].store).not.toBe(categoryComponents[1].store);

    categoryComponents[0].store.openCreateForm();

    expect(categoryComponents[0].store.formVisible()).toBeTrue();
    expect(categoryComponents[1].store.formVisible()).toBeFalse();
  });

  it('should render without standalone chrome when embedded', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('section.app-page')).toBeNull();
    expect(nativeElement.querySelector('[data-testid="category-embedded"]')).not.toBeNull();
    expect(nativeElement.querySelector('[data-testid="category-list-embedded"]')).not.toBeNull();
  });
});
