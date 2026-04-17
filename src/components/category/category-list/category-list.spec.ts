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
    expect(nativeElement.textContent).toContain('Aucune categorie disponible.');
  });
});
