import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryList } from './category-list';

describe('CategoryList', () => {
  let component: CategoryList;
  let fixture: ComponentFixture<CategoryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('selects and deselects exactly once through the native checkbox', () => {
    const emitted: unknown[] = [];
    component.selectedMany.subscribe((items) => emitted.push(items));
    fixture.componentRef.setInput('categories', [{ id: '1', name: 'Test', warnBeforeDays: null, recentlyExpiredDays: null, minQuantity: null }]);
    fixture.componentRef.setInput('mode', 'select-multi');
    fixture.detectChanges();
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('mat-checkbox input[type="checkbox"]');
    expect(checkbox.getAttribute('aria-label')).toBe('Select Test');
    checkbox.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(1);
    expect(component.isSelected('1')).toBeTrue();
    checkbox.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(2);
    expect(emitted.at(-1)).toEqual([]);
    expect(component.isSelected('1')).toBeFalse();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the standalone chrome by default', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('mat-card')).not.toBeNull();
    expect(nativeElement.querySelector('.add-btn')).not.toBeNull();
  });

  it('should remove the local card chrome when embedded', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('mat-card')).toBeNull();
    expect(nativeElement.querySelector('.add-btn')).toBeNull();
    expect(nativeElement.querySelector('[data-testid="category-list-embedded"]')).not.toBeNull();
    expect(nativeElement.textContent).toContain('No category available.');
  });
});
